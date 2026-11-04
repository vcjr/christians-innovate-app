import 'package:flutter/material.dart';

/// Design tokens. Blue comes from the logo; paper and gold keep reading warm and calm.
abstract final class Tokens {
  static const blue = Color(0xFF1E63C6);
  static const blueDeep = Color(0xFF0F2A52);
  static const blueNight = Color(0xFF7FAAF5);
  static const gold = Color(0xFFE2A43A);
  static const goldNight = Color(0xFFF0BE62);

  static const paper = Color(0xFFF7F5F0);
  static const ink = Color(0xFF16181D);
  static const inkSoft = Color(0xFF3C4049);
  static const muted = Color(0xFF6C717B);
  static const line = Color(0xFFE6E2D9);
  static const sunken = Color(0xFFEFECE5);

  static const night = Color(0xFF0D1015);
  static const nightSurface = Color(0xFF161A21);
  static const nightRaised = Color(0xFF1E232C);
  static const nightInk = Color(0xFFECEEF2);
  static const nightMuted = Color(0xFF9AA1AD);
  static const nightLine = Color(0xFF29303B);

  static const success = Color(0xFF2F8F5B);
  static const danger = Color(0xFFC2412D);

  static const space1 = 4.0;
  static const space2 = 8.0;
  static const space3 = 12.0;
  static const space4 = 16.0;
  static const space5 = 20.0;
  static const space6 = 24.0;
  static const space8 = 32.0;

  static const radiusS = 10.0;
  static const radiusM = 16.0;
  static const radiusL = 24.0;

  static const sans = 'PlusJakartaSans';
  static const serif = 'Literata';
  static const display = 'LiterataDisplay';
}

/// Colors Material's scheme has no slot for.
@immutable
class CiColors extends ThemeExtension<CiColors> {
  const CiColors({
    required this.muted,
    required this.line,
    required this.sunken,
    required this.accent,
    required this.success,
    required this.hero,
    required this.onHero,
  });

  final Color muted;
  final Color line;
  final Color sunken;
  final Color accent;
  final Color success;

  /// The deep blue behind the Today card and the plan header.
  final Color hero;
  final Color onHero;

  static const light = CiColors(
    muted: Tokens.muted,
    line: Tokens.line,
    sunken: Tokens.sunken,
    accent: Tokens.gold,
    success: Tokens.success,
    hero: Tokens.blueDeep,
    onHero: Colors.white,
  );

  static const dark = CiColors(
    muted: Tokens.nightMuted,
    line: Tokens.nightLine,
    sunken: Tokens.nightRaised,
    accent: Tokens.goldNight,
    success: Color(0xFF5CC08A),
    hero: Color(0xFF17305A),
    onHero: Colors.white,
  );

  @override
  CiColors copyWith({Color? muted, Color? line, Color? sunken, Color? accent, Color? success, Color? hero, Color? onHero}) => CiColors(
    muted: muted ?? this.muted,
    line: line ?? this.line,
    sunken: sunken ?? this.sunken,
    accent: accent ?? this.accent,
    success: success ?? this.success,
    hero: hero ?? this.hero,
    onHero: onHero ?? this.onHero,
  );

  @override
  CiColors lerp(CiColors? other, double t) {
    if (other == null) return this;
    return CiColors(
      muted: Color.lerp(muted, other.muted, t)!,
      line: Color.lerp(line, other.line, t)!,
      sunken: Color.lerp(sunken, other.sunken, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      success: Color.lerp(success, other.success, t)!,
      hero: Color.lerp(hero, other.hero, t)!,
      onHero: Color.lerp(onHero, other.onHero, t)!,
    );
  }
}

extension ThemeX on BuildContext {
  ThemeData get theme => Theme.of(this);
  TextTheme get text => Theme.of(this).textTheme;
  ColorScheme get colors => Theme.of(this).colorScheme;
  CiColors get ci => Theme.of(this).extension<CiColors>()!;

  /// Serif display type for big moments: greetings, plan titles, chapter headings.
  TextStyle displayText({double size = 30, Color? color}) => TextStyle(
    fontFamily: Tokens.display,
    fontWeight: FontWeight.w600,
    fontSize: size,
    height: 1.15,
    letterSpacing: -0.4,
    color: color ?? colors.onSurface,
  );
}

ThemeData buildTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final ci = dark ? CiColors.dark : CiColors.light;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: dark ? Tokens.blueNight : Tokens.blue,
    onPrimary: dark ? Tokens.night : Colors.white,
    primaryContainer: dark ? const Color(0xFF1B3561) : const Color(0xFFDDE8FA),
    onPrimaryContainer: dark ? const Color(0xFFDCE7FF) : Tokens.blueDeep,
    secondary: ci.accent,
    onSecondary: Tokens.ink,
    secondaryContainer: dark ? const Color(0xFF3A2E14) : const Color(0xFFFBEBCB),
    onSecondaryContainer: dark ? const Color(0xFFF7DDA6) : const Color(0xFF5A3C05),
    error: Tokens.danger,
    onError: Colors.white,
    surface: dark ? Tokens.nightSurface : Colors.white,
    onSurface: dark ? Tokens.nightInk : Tokens.ink,
    onSurfaceVariant: ci.muted,
    surfaceContainerLowest: dark ? Tokens.night : Tokens.paper,
    surfaceContainerLow: dark ? Tokens.nightSurface : Colors.white,
    surfaceContainer: dark ? Tokens.nightRaised : Tokens.sunken,
    surfaceContainerHigh: dark ? Tokens.nightRaised : Tokens.sunken,
    surfaceContainerHighest: dark ? const Color(0xFF262C36) : const Color(0xFFE8E4DB),
    outline: dark ? const Color(0xFF3A4350) : const Color(0xFFD3CEC3),
    outlineVariant: ci.line,
    inverseSurface: dark ? Tokens.nightInk : Tokens.ink,
    onInverseSurface: dark ? Tokens.night : Colors.white,
  );

  final ink = scheme.onSurface;
  TextStyle sans(double size, FontWeight weight, {double height = 1.4, double spacing = 0, Color? color}) =>
      TextStyle(fontFamily: Tokens.sans, fontSize: size, fontWeight: weight, height: height, letterSpacing: spacing, color: color ?? ink);

  final textTheme = TextTheme(
    displaySmall: TextStyle(
      fontFamily: Tokens.display,
      fontSize: 34,
      fontWeight: FontWeight.w600,
      height: 1.12,
      letterSpacing: -0.5,
      color: ink,
    ),
    headlineMedium: TextStyle(
      fontFamily: Tokens.display,
      fontSize: 28,
      fontWeight: FontWeight.w600,
      height: 1.15,
      letterSpacing: -0.4,
      color: ink,
    ),
    headlineSmall: sans(22, FontWeight.w700, height: 1.25, spacing: -0.3),
    titleLarge: sans(19, FontWeight.w700, height: 1.3, spacing: -0.2),
    titleMedium: sans(16, FontWeight.w700, height: 1.35, spacing: -0.1),
    titleSmall: sans(14, FontWeight.w700, height: 1.35),
    bodyLarge: sans(16, FontWeight.w400, height: 1.5),
    bodyMedium: sans(14.5, FontWeight.w400, height: 1.5),
    bodySmall: sans(13, FontWeight.w500, height: 1.45, color: ci.muted),
    labelLarge: sans(15, FontWeight.w700, height: 1.2),
    labelMedium: sans(13, FontWeight.w600, height: 1.2),
    labelSmall: sans(11.5, FontWeight.w700, height: 1.2, spacing: 0.6, color: ci.muted),
  );

  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.radiusM));
  final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(999));

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    fontFamily: Tokens.sans,
    textTheme: textTheme,
    scaffoldBackgroundColor: scheme.surfaceContainerLowest,
    extensions: [ci],
    splashFactory: InkSparkle.splashFactory,
    visualDensity: VisualDensity.standard,
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.surfaceContainerLowest,
      surfaceTintColor: Colors.transparent,
      foregroundColor: ink,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: textTheme.titleLarge,
    ),
    cardTheme: CardThemeData(
      color: scheme.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: shape.copyWith(side: BorderSide(color: ci.line)),
      clipBehavior: Clip.antiAlias,
    ),
    dividerTheme: DividerThemeData(color: ci.line, thickness: 1, space: 1),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 52),
        padding: const EdgeInsets.symmetric(horizontal: Tokens.space6),
        shape: buttonShape,
        textStyle: textTheme.labelLarge,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 52),
        padding: const EdgeInsets.symmetric(horizontal: Tokens.space6),
        shape: buttonShape,
        side: BorderSide(color: scheme.outline),
        foregroundColor: ink,
        textStyle: textTheme.labelLarge,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(shape: buttonShape, textStyle: textTheme.labelLarge),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainer,
      contentPadding: const EdgeInsets.fromLTRB(Tokens.space4, 14, Tokens.space4, 12),
      // Underline borders keep a floating label inside the filled box rather than on its edge.
      border: UnderlineInputBorder(borderRadius: BorderRadius.circular(Tokens.radiusS + 4), borderSide: BorderSide.none),
      enabledBorder: UnderlineInputBorder(borderRadius: BorderRadius.circular(Tokens.radiusS + 4), borderSide: BorderSide.none),
      focusedBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.circular(Tokens.radiusS + 4),
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
      errorBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.circular(Tokens.radiusS + 4),
        borderSide: const BorderSide(color: Tokens.danger, width: 2),
      ),
      hintStyle: textTheme.bodyMedium?.copyWith(color: ci.muted),
      labelStyle: textTheme.bodyMedium?.copyWith(color: ci.muted),
      floatingLabelStyle: textTheme.labelMedium?.copyWith(color: scheme.primary),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: scheme.surface,
      selectedColor: scheme.onSurface,
      side: BorderSide(color: ci.line),
      shape: buttonShape,
      labelStyle: textTheme.labelMedium,
      secondaryLabelStyle: textTheme.labelMedium?.copyWith(color: scheme.surface),
      checkmarkColor: scheme.surface,
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: Tokens.space2, vertical: 6),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 68,
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      indicatorColor: scheme.primaryContainer,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => textTheme.labelSmall?.copyWith(letterSpacing: 0.1, fontSize: 11.5, color: s.contains(WidgetState.selected) ? ink : ci.muted),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(size: 24, color: s.contains(WidgetState.selected) ? scheme.onPrimaryContainer : ci.muted),
      ),
    ),
    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(horizontal: Tokens.space4),
      titleTextStyle: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
      subtitleTextStyle: textTheme.bodySmall,
      iconColor: ci.muted,
      minVerticalPadding: 12,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? scheme.onPrimary : scheme.outline),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? scheme.primary : scheme.surfaceContainer),
      trackOutlineColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.transparent : scheme.outline),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
      dragHandleColor: scheme.outline,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(Tokens.radiusL + 4))),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.radiusL)),
      titleTextStyle: textTheme.titleLarge,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: scheme.inverseSurface,
      contentTextStyle: textTheme.bodyMedium?.copyWith(color: scheme.onInverseSurface, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.radiusM)),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: SegmentedButton.styleFrom(
        selectedBackgroundColor: scheme.onSurface,
        selectedForegroundColor: scheme.surface,
        side: BorderSide(color: ci.line),
        textStyle: textTheme.labelMedium,
      ),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: scheme.primary,
      linearTrackColor: scheme.surfaceContainer,
      circularTrackColor: scheme.surfaceContainer,
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: scheme.onSurface,
      foregroundColor: scheme.surface,
      elevation: 2,
      shape: buttonShape,
      extendedTextStyle: textTheme.labelLarge,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
        TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
      },
    ),
  );
}
