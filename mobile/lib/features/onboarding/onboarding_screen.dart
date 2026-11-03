import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../widgets/common.dart';
import '../../widgets/profile_fields.dart';

/// First sign-in: a few optional steps that fill in the member's directory profile.
/// Mirrors the web's onboarding (app/onboarding/onboarding.ts) with links on one page.
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: AsyncBody<Profile>(
        value: ref.watch(profileProvider),
        onRetry: () => ref.invalidate(profileProvider),
        data: (p) => _Steps(profile: p),
      ),
    );
  }
}

class _Steps extends ConsumerStatefulWidget {
  const _Steps({required this.profile});
  final Profile profile;
  @override
  ConsumerState<_Steps> createState() => _StepsState();
}

class _StepsState extends ConsumerState<_Steps> {
  final _pages = PageController();
  final _linksForm = GlobalKey<FormState>();
  int _step = 0;
  bool _busy = false;

  late final _bio = TextEditingController(text: widget.profile.bio);
  late final _linkedin = TextEditingController(text: widget.profile.linkedinUrl);
  late final _website = TextEditingController(text: widget.profile.websiteUrl);
  late String? _avatar = widget.profile.avatarUrl;
  late List<String> _skills = widget.profile.skills;
  late List<String> _interests = widget.profile.interests;
  late bool _business = widget.profile.lookingForBusinessPartner;
  late bool _accountability = widget.profile.lookingForAccountabilityPartner;

  static const _count = 5;

  @override
  void dispose() {
    for (final c in [_bio, _linkedin, _website]) {
      c.dispose();
    }
    _pages.dispose();
    super.dispose();
  }

  Future<void> _next() async {
    if (_step < _count - 1) {
      await _pages.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOutCubic);
      return;
    }
    if (!(_linksForm.currentState?.validate() ?? true)) return;
    setState(() => _busy = true);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).updateProfile({
        'bio': _bio.text.trim(),
        'avatar_url': _avatar,
        'skills': _skills,
        'interests': _interests,
        'looking_for_business_partner': _business,
        'looking_for_accountability_partner': _accountability,
        'linkedin_url': normalizeUrl(_linkedin.text),
        'website_url': normalizeUrl(_website.text),
        'has_completed_onboarding': true,
      }),
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      ref.invalidate(profileProvider);
      context.go('/today');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.profile;
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Tokens.space5, Tokens.space3, Tokens.space2, 0),
            child: Row(
              children: [
                if (_step > 0)
                  IconButton(
                    tooltip: 'Back',
                    onPressed: () => _pages.previousPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOutCubic),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(end: (_step + 1) / _count),
                      duration: const Duration(milliseconds: 280),
                      builder: (_, v, _) => LinearProgressIndicator(value: v, minHeight: 6),
                    ),
                  ),
                ),
                TextButton(onPressed: _busy || _step == _count - 1 ? null : () => _pages.jumpToPage(_count - 1), child: const Text('Skip')),
              ],
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pages,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (i) => setState(() => _step = i),
              children: [
                _Page(
                  title: 'Welcome, ${p.firstName}',
                  subtitle:
                      'Christians Innovate is a community of believers building for the next 5, 50, and 500 years. '
                      'Let’s set up your profile so others can find you. Every step is optional.',
                  children: [
                    const SizedBox(height: Tokens.space6),
                    for (final (icon, text) in const [
                      (Icons.auto_stories_rounded, 'Read Scripture daily with the whole community'),
                      (Icons.volunteer_activism_rounded, 'Share prayer requests, launches and wins'),
                      (Icons.handshake_rounded, 'Keep each other accountable in small groups'),
                    ])
                      Padding(
                        padding: const EdgeInsets.only(bottom: Tokens.space4),
                        child: Row(
                          children: [
                            Icon(icon, color: context.colors.primary),
                            const SizedBox(width: Tokens.space3),
                            Expanded(child: Text(text, style: context.text.bodyLarge)),
                          ],
                        ),
                      ),
                  ],
                ),
                _Page(
                  title: 'Tell us about yourself',
                  subtitle: 'A photo and a few lines help members get to know you.',
                  children: [
                    const SizedBox(height: Tokens.space5),
                    PhotoPicker(name: p.displayName, url: _avatar, onUploaded: (u) => setState(() => _avatar = u)),
                    const SizedBox(height: Tokens.space5),
                    TextField(
                      controller: _bio,
                      minLines: 4,
                      maxLines: 6,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(hintText: 'What do you do, and what are you building?'),
                    ),
                  ],
                ),
                _Page(
                  title: 'What are you good at?',
                  subtitle: 'Your skills show in the member directory.',
                  children: [
                    const SizedBox(height: Tokens.space5),
                    TagEditor(
                      tags: _skills,
                      hint: 'Add a skill',
                      suggestions: const [
                        'Software Engineering',
                        'Design',
                        'Marketing',
                        'Sales',
                        'Finance',
                        'Operations',
                        'Writing',
                        'Teaching',
                      ],
                      onChanged: (t) => setState(() => _skills = t),
                    ),
                    const SizedBox(height: Tokens.space6),
                    Text('Interests', style: context.text.titleMedium),
                    const SizedBox(height: Tokens.space2),
                    TagEditor(
                      tags: _interests,
                      hint: 'Add an interest',
                      suggestions: const ['Entrepreneurship', 'Ministry', 'Technology', 'Family', 'Fitness', 'Music', 'Missions'],
                      onChanged: (t) => setState(() => _interests = t),
                    ),
                  ],
                ),
                _Page(
                  title: 'What are you looking for?',
                  subtitle: 'Members looking for the same thing can reach out.',
                  children: [
                    const SizedBox(height: Tokens.space5),
                    _Choice(
                      icon: Icons.work_outline_rounded,
                      title: 'A business partner',
                      subtitle: 'Someone to build a venture with',
                      selected: _business,
                      onTap: () => setState(() => _business = !_business),
                    ),
                    const SizedBox(height: Tokens.space3),
                    _Choice(
                      icon: Icons.handshake_outlined,
                      title: 'An accountability partner',
                      subtitle: 'Someone to stay consistent with in faith and work',
                      selected: _accountability,
                      onTap: () => setState(() => _accountability = !_accountability),
                    ),
                  ],
                ),
                _Page(
                  title: 'Where can people find you?',
                  subtitle: 'Add any links you’d like on your profile.',
                  children: [
                    const SizedBox(height: Tokens.space5),
                    Form(
                      key: _linksForm,
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _linkedin,
                            decoration: const InputDecoration(labelText: 'LinkedIn'),
                            keyboardType: TextInputType.url,
                            validator: urlError,
                          ),
                          const SizedBox(height: Tokens.space3),
                          TextFormField(
                            controller: _website,
                            decoration: const InputDecoration(labelText: 'Website'),
                            keyboardType: TextInputType.url,
                            validator: urlError,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(Tokens.space5),
            child: FilledButton(
              key: const Key('onboarding-next'),
              onPressed: _busy ? null : _next,
              child: Text(_step == 0 ? 'Get started' : (_step == _count - 1 ? 'Finish' : 'Continue')),
            ),
          ),
        ],
      ),
    );
  }
}

class _Page extends StatelessWidget {
  const _Page({required this.title, required this.subtitle, required this.children});
  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(Tokens.space6, Tokens.space8, Tokens.space6, Tokens.space4),
    children: [
      Text(title, style: context.displayText(size: 32)),
      const SizedBox(height: Tokens.space3),
      Text(subtitle, style: context.text.bodyLarge?.copyWith(color: context.ci.muted)),
      ...children,
    ],
  );
}

class _Choice extends StatelessWidget {
  const _Choice({required this.icon, required this.title, required this.subtitle, required this.selected, required this.onTap});
  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      decoration: BoxDecoration(
        color: selected ? context.colors.primaryContainer : context.colors.surface,
        borderRadius: BorderRadius.circular(Tokens.radiusM),
        border: Border.all(color: selected ? context.colors.primary : context.ci.line, width: selected ? 2 : 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Tokens.radiusM),
        child: Padding(
          padding: const EdgeInsets.all(Tokens.space4),
          child: Row(
            children: [
              Icon(icon, color: selected ? context.colors.primary : context.ci.muted),
              const SizedBox(width: Tokens.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: context.text.titleSmall),
                    Text(subtitle, style: context.text.bodySmall),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                color: selected ? context.colors.primary : context.ci.line,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
