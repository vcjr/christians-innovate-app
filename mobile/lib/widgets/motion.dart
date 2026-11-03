import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/theme.dart';

/// Fades and lifts its child in once, after a delay set by [index], so a screen's sections arrive in order.
class FadeSlideIn extends StatefulWidget {
  const FadeSlideIn({super.key, required this.child, this.index = 0, this.offset = 16});
  final Widget child;
  final int index;
  final double offset;

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn> with SingleTickerProviderStateMixin {
  static const _step = 70, _run = 380;
  late final _c = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: _run + widget.index * _step),
  )..forward();
  late final _a = CurvedAnimation(
    parent: _c,
    curve: Interval(widget.index * _step / (_run + widget.index * _step), 1, curve: Curves.easeOutCubic),
  );

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return widget.child;
    return FadeTransition(
      opacity: _a,
      child: AnimatedBuilder(
        animation: _a,
        builder: (_, child) => Transform.translate(offset: Offset(0, widget.offset * (1 - _a.value)), child: child),
        child: widget.child,
      ),
    );
  }
}

/// A number that counts up or down to its new value.
class AnimatedCount extends StatelessWidget {
  const AnimatedCount(this.value, {super.key, this.style});
  final int value;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(end: value.toDouble()),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutCubic,
      builder: (_, v, _) => Text('${v.round()}', style: style),
    );
  }
}

/// A thin ring around [child] that fills to [value] (0 to 1).
class ProgressRing extends StatelessWidget {
  const ProgressRing({super.key, required this.value, required this.child, this.size = 40, this.stroke = 2.5, this.color});
  final double value;
  final Widget child;
  final double size;
  final double stroke;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? context.colors.primary;
    return TweenAnimationBuilder<double>(
      tween: Tween(end: value.clamp(0, 1)),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (_, v, child) => CustomPaint(
        painter: _RingPainter(v, c, context.ci.line, stroke),
        child: SizedBox.square(
          dimension: size,
          child: Center(child: child),
        ),
      ),
      child: child,
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value, this.color, this.track, this.stroke);
  final double value;
  final Color color;
  final Color track;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = (Offset.zero & size).deflate(stroke / 2);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, 0, math.pi * 2, false, paint..color = track);
    if (value > 0) canvas.drawArc(rect, -math.pi / 2, math.pi * 2 * value, false, paint..color = color);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value || old.color != color || old.track != track;
}

/// A one-off burst of dots from the middle of its box, for finishing a reading. [big] is for streak milestones.
class CelebrationBurst extends StatefulWidget {
  const CelebrationBurst({super.key, this.big = false});
  final bool big;

  @override
  State<CelebrationBurst> createState() => _CelebrationBurstState();
}

class _CelebrationBurstState extends State<CelebrationBurst> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: widget.big ? 1400 : 1000),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return const SizedBox.shrink();
    final colors = widget.big
        ? [context.ci.accent, Tokens.gold, const Color(0xFFF6D58E)]
        : [context.ci.accent, context.colors.primary, context.ci.success];
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, _) => CustomPaint(painter: _BurstPainter(_c.value, colors, widget.big)),
      ),
    );
  }
}

class _BurstPainter extends CustomPainter {
  _BurstPainter(this.t, this.colors, this.big);
  final double t;
  final List<Color> colors;
  final bool big;

  @override
  void paint(Canvas canvas, Size size) {
    if (t == 0 || t == 1) return;
    final n = big ? 30 : 18;
    final reach = (big ? 150.0 : 100.0) * Curves.easeOutCubic.transform(t);
    final fade = t < 0.45 ? 1.0 : 1 - (t - 0.45) / 0.55;
    final center = size.center(Offset.zero);
    for (var i = 0; i < n; i++) {
      final angle = i / n * math.pi * 2 + (i.isOdd ? 0.13 : 0);
      final spread = 0.65 + 0.35 * ((i * 37) % 10) / 10;
      final p = center + Offset(math.cos(angle), math.sin(angle)) * reach * spread + Offset(0, 30 * t * t);
      final paint = Paint()..color = colors[i % colors.length].withValues(alpha: fade);
      final r = (big ? 5.0 : 3.6) * (1 - t * 0.4);
      if (i % 3 == 0) {
        canvas.save();
        canvas.translate(p.dx, p.dy);
        canvas.rotate(angle + t * 4);
        canvas.drawRRect(
          RRect.fromRectAndRadius(Rect.fromCenter(center: Offset.zero, width: r * 2.6, height: r * 1.2), const Radius.circular(2)),
          paint,
        );
        canvas.restore();
      } else {
        canvas.drawCircle(p, r, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_BurstPainter old) => old.t != t;
}

/// A wide button that has to be held down: it fills as you hold, ticks as it goes, and fires
/// [onConfirmed] when full. Letting go early drains it. Screen readers get a plain tap.
class HoldToConfirm extends StatefulWidget {
  const HoldToConfirm({
    super.key,
    required this.label,
    required this.semanticLabel,
    required this.onConfirmed,
    this.icon = Icons.check_rounded,
    this.busy = false,
    this.duration = const Duration(milliseconds: 900),
  });
  final String label;
  final String semanticLabel;
  final VoidCallback onConfirmed;
  final IconData icon;
  final bool busy;
  final Duration duration;

  @override
  State<HoldToConfirm> createState() => _HoldToConfirmState();
}

class _HoldToConfirmState extends State<HoldToConfirm> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: widget.duration, reverseDuration: const Duration(milliseconds: 250));
  int _ticks = 0;

  @override
  void initState() {
    super.initState();
    _c.addListener(() {
      final tick = (_c.value * 4).floor();
      if (_c.status == AnimationStatus.forward && tick > _ticks && tick < 4) HapticFeedback.selectionClick();
      _ticks = tick;
    });
    _c.addStatusListener((s) {
      if (s != AnimationStatus.completed) return;
      HapticFeedback.heavyImpact();
      widget.onConfirmed();
      _c.value = 0;
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _down() {
    if (!widget.busy) _c.forward();
  }

  // A release before the first frame still has to drain, or a quick tap would run to the end.
  void _up({bool tapped = false}) {
    if (_c.isCompleted || (!_c.isAnimating && _c.value == 0)) return;
    if (tapped && _c.value < 0.3) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('Press and hold to finish'), duration: Duration(seconds: 2)));
    }
    _c.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.colors;
    return Semantics(
      button: true,
      label: widget.semanticLabel,
      onTap: widget.busy ? null : widget.onConfirmed,
      excludeSemantics: true,
      child: GestureDetector(
        onTapDown: (_) => _down(),
        onTapUp: (_) => _up(tapped: true),
        onTapCancel: _up,
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final v = Curves.easeOut.transform(_c.value);
            return AnimatedScale(
              scale: _c.value > 0 ? 0.98 : 1,
              duration: const Duration(milliseconds: 160),
              curve: Curves.easeOutCubic,
              child: Container(
                height: 56,
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(999)),
                child: Stack(
                  children: [
                    FractionallySizedBox(
                      widthFactor: v,
                      heightFactor: 1,
                      alignment: Alignment.centerLeft,
                      child: ColoredBox(color: context.ci.success),
                    ),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox.square(
                            dimension: 22,
                            child: widget.busy
                                ? CircularProgressIndicator(strokeWidth: 2.2, color: scheme.onPrimary)
                                : _c.value == 0
                                ? Icon(widget.icon, color: scheme.onPrimary, size: 22)
                                : CircularProgressIndicator(
                                    value: v,
                                    strokeWidth: 2.6,
                                    color: scheme.onPrimary,
                                    backgroundColor: scheme.onPrimary.withValues(alpha: 0.25),
                                  ),
                          ),
                          const SizedBox(width: Tokens.space3),
                          Text(widget.label, style: context.text.labelLarge?.copyWith(color: scheme.onPrimary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Text that flies between two screens, easing its size and color on the way.
/// Both ends need the same [tag].
class HeroText extends StatelessWidget {
  const HeroText(this.text, {super.key, required this.tag, required this.style, this.maxLines});
  final String text;
  final Object tag;
  final TextStyle style;
  final int? maxLines;

  static Widget _flight(BuildContext _, Animation<double> a, HeroFlightDirection dir, BuildContext from, BuildContext to) {
    final f = from.findAncestorWidgetOfExactType<HeroText>()!;
    final t = to.findAncestorWidgetOfExactType<HeroText>()!;
    // The animation runs 0→1 on push and 1→0 on pop, so the start style is always the pushing screen's.
    final (start, end) = dir == HeroFlightDirection.push ? (f, t) : (t, f);
    return AnimatedBuilder(
      animation: a,
      builder: (_, _) => Material(
        type: MaterialType.transparency,
        child: Align(
          alignment: Alignment.topLeft,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.topLeft,
            child: Text(end.text, maxLines: 1, style: TextStyle.lerp(start.style, end.style, a.value)),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: tag,
      flightShuttleBuilder: _flight,
      child: Material(
        type: MaterialType.transparency,
        child: Text(text, style: style, maxLines: maxLines, overflow: maxLines == null ? null : TextOverflow.ellipsis),
      ),
    );
  }
}
