import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../app/theme.dart';

/// A soft light that sweeps across placeholder shapes while content loads.
class Shimmer extends StatefulWidget {
  const Shimmer({super.key, required this.child});
  final Widget child;

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return widget.child;
    final base = context.ci.sunken;
    final light = Color.lerp(base, context.colors.surface, 0.7)!;
    return AnimatedBuilder(
      animation: _c,
      builder: (_, child) => ShaderMask(
        blendMode: BlendMode.srcATop,
        shaderCallback: (rect) => LinearGradient(
          colors: [base, light, base],
          stops: const [0.35, 0.5, 0.65],
          transform: _Slide(_c.value * 2 - 1),
        ).createShader(rect),
        child: child,
      ),
      child: widget.child,
    );
  }
}

class _Slide extends GradientTransform {
  const _Slide(this.t);
  final double t;

  @override
  Matrix4 transform(Rect bounds, {TextDirection? textDirection}) => Matrix4.translationValues(bounds.width * t, 0, 0);
}

/// A rounded placeholder block.
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({super.key, this.width, required this.height, this.radius = Tokens.radiusS});
  final double? width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(color: context.ci.sunken, borderRadius: BorderRadius.circular(radius)),
    );
  }
}

/// Placeholder cards, the default while a list or screen loads.
class SkeletonCards extends StatelessWidget {
  const SkeletonCards({super.key, this.count = 3, this.padding = const EdgeInsets.all(Tokens.space5)});
  final int count;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Padding(
        padding: padding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < count; i++) ...[
              if (i > 0) const SizedBox(height: Tokens.space3),
              Container(
                padding: const EdgeInsets.all(Tokens.space4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(Tokens.radiusM),
                  border: Border.all(color: context.ci.line),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(width: 40, height: 40, radius: 20),
                    SizedBox(width: Tokens.space3),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonBox(width: 120, height: 12),
                          SizedBox(height: Tokens.space3),
                          SkeletonBox(height: 10),
                          SizedBox(height: Tokens.space2),
                          SkeletonBox(width: 180, height: 10),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Placeholder lines of text, for scripture while a chapter loads.
class SkeletonLines extends StatelessWidget {
  const SkeletonLines({super.key, this.lines = 12, this.lineHeight = 14, this.padding = EdgeInsets.zero});
  final int lines;
  final double lineHeight;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < lines; i++)
              Padding(
                padding: EdgeInsets.only(bottom: lineHeight * 0.9),
                // Ragged right edges read as text rather than bars.
                child: FractionallySizedBox(
                  widthFactor: i % 5 == 4 ? 0.55 : 0.86 + 0.14 * ((i * 7) % 3) / 2,
                  child: SkeletonBox(height: lineHeight, radius: 6),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Pull-to-refresh with the globe from the logo: it turns as you pull and spins while refreshing.
class GlobeRefresh extends StatefulWidget {
  const GlobeRefresh({super.key, required this.onRefresh, required this.child});
  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  State<GlobeRefresh> createState() => _GlobeRefreshState();
}

class _GlobeRefreshState extends State<GlobeRefresh> with SingleTickerProviderStateMixin {
  static const _distance = 110.0;
  late final _spin = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
  double _pull = 0;
  bool _refreshing = false;

  @override
  void dispose() {
    _spin.dispose();
    super.dispose();
  }

  void _setPull(double v) {
    v = v.clamp(0, 1.4);
    if (v != _pull) setState(() => _pull = v);
  }

  bool _onScroll(ScrollNotification n) {
    if (n.depth != 0 || _refreshing) return false;
    if (n is OverscrollNotification && n.dragDetails != null && n.overscroll < 0) {
      _setPull(_pull - n.overscroll / _distance);
    } else if (n is ScrollUpdateNotification && n.metrics.pixels < 0) {
      _setPull(-n.metrics.pixels / _distance);
    } else if (n is ScrollUpdateNotification && _pull > 0 && (n.scrollDelta ?? 0) > 0) {
      _setPull(_pull - n.scrollDelta! / _distance);
    } else if (n is ScrollEndNotification) {
      _setPull(0);
    }
    return false;
  }

  Future<void> _run() async {
    setState(() => _refreshing = true);
    _spin.repeat();
    try {
      await widget.onRefresh();
    } finally {
      if (mounted) {
        _spin.stop();
        setState(() {
          _refreshing = false;
          _pull = 0;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final shown = _refreshing ? 1.0 : _pull.clamp(0.0, 1.0);
    return Stack(
      children: [
        NotificationListener<ScrollNotification>(
          onNotification: _onScroll,
          child: RefreshIndicator(
            onRefresh: _run,
            color: Colors.transparent,
            backgroundColor: Colors.transparent,
            elevation: 0,
            child: widget.child,
          ),
        ),
        if (shown > 0)
          Positioned(
            top: Tokens.space3,
            left: 0,
            right: 0,
            child: IgnorePointer(
              child: Center(
                child: Opacity(
                  opacity: shown,
                  child: Transform.translate(
                    offset: Offset(0, -16 * (1 - shown)),
                    child: AnimatedBuilder(
                      animation: _spin,
                      builder: (_, child) => Transform.rotate(angle: (_refreshing ? _spin.value : _pull * 0.6) * math.pi * 2, child: child),
                      child: Container(
                        width: 40,
                        height: 40,
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: context.colors.surface,
                          shape: BoxShape.circle,
                          boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 12, offset: Offset(0, 3))],
                        ),
                        child: Image.asset('assets/images/globe.png', color: context.colors.primary, colorBlendMode: BlendMode.srcIn),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
