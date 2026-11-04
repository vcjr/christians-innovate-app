import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Wraps a reader's scroll view with a thin bar under the status bar showing how far down
/// the page you are. [onDirection] reports which way the reader is scrolling.
class ReadingProgress extends StatefulWidget {
  const ReadingProgress({super.key, required this.child, required this.color, this.onDirection});
  final Widget child;
  final Color color;
  final ValueChanged<ScrollDirection>? onDirection;

  @override
  State<ReadingProgress> createState() => _ReadingProgressState();
}

class _ReadingProgressState extends State<ReadingProgress> {
  final _progress = ValueNotifier<double>(0);

  @override
  void dispose() {
    _progress.dispose();
    super.dispose();
  }

  bool _onScroll(ScrollNotification n) {
    if (n.depth != 0) return false;
    final m = n.metrics;
    _progress.value = m.maxScrollExtent <= 0 ? 0 : (m.pixels / m.maxScrollExtent).clamp(0, 1);
    if (n is UserScrollNotification) widget.onDirection?.call(n.direction);
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        NotificationListener<ScrollNotification>(onNotification: _onScroll, child: widget.child),
        Positioned(
          top: MediaQuery.paddingOf(context).top,
          left: 0,
          right: 0,
          child: IgnorePointer(
            child: ValueListenableBuilder<double>(
              valueListenable: _progress,
              builder: (_, v, _) => Align(
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: v,
                  child: Container(
                    height: 2.5,
                    decoration: BoxDecoration(
                      color: widget.color,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(2)),
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

/// A floating, frosted pill for reader controls.
class FrostedBar extends StatelessWidget {
  const FrostedBar({super.key, required this.child, required this.background, required this.border});
  final Widget child;
  final Color background;
  final Color border;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        boxShadow: const [BoxShadow(color: Color(0x26000000), blurRadius: 24, offset: Offset(0, 8))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(999),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: background.withValues(alpha: 0.78),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: border),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
