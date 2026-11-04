import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../widgets/common.dart';
import '../../widgets/profile_fields.dart';

class ProfileEditScreen extends ConsumerWidget {
  const ProfileEditScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: AsyncBody<Profile>(
        value: ref.watch(profileProvider),
        onRetry: () => ref.invalidate(profileProvider),
        data: (p) => _Form(profile: p),
      ),
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({required this.profile});
  final Profile profile;
  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.profile.fullName);
  late final _bio = TextEditingController(text: widget.profile.bio);
  late final _links = {
    'website_url': TextEditingController(text: widget.profile.websiteUrl),
    'linkedin_url': TextEditingController(text: widget.profile.linkedinUrl),
    'twitter_url': TextEditingController(text: widget.profile.twitterUrl),
    'facebook_url': TextEditingController(text: widget.profile.facebookUrl),
  };
  late String? _avatar = widget.profile.avatarUrl;
  late List<String> _skills = widget.profile.skills;
  late List<String> _interests = widget.profile.interests;
  late bool _business = widget.profile.lookingForBusinessPartner;
  late bool _accountability = widget.profile.lookingForAccountabilityPartner;
  bool _busy = false;

  static const _linkLabels = {
    'website_url': 'Website',
    'linkedin_url': 'LinkedIn',
    'twitter_url': 'X (Twitter)',
    'facebook_url': 'Facebook',
  };

  @override
  void dispose() {
    for (final c in [_name, _bio, ..._links.values]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).updateProfile({
        'full_name': _name.text.trim(),
        'bio': _bio.text.trim(),
        'avatar_url': _avatar,
        'skills': _skills,
        'interests': _interests,
        'looking_for_business_partner': _business,
        'looking_for_accountability_partner': _accountability,
        for (final e in _links.entries) e.key: normalizeUrl(e.value.text),
      }),
      done: 'Profile saved',
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      ref.invalidate(profileProvider);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(Tokens.space5, Tokens.space2, Tokens.space5, Tokens.space8),
        children: [
          PhotoPicker(name: _name.text, url: _avatar, onUploaded: (u) => setState(() => _avatar = u)),
          const SizedBox(height: Tokens.space5),
          TextFormField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Full name'),
            textCapitalization: TextCapitalization.words,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter your name' : null,
          ),
          const SizedBox(height: Tokens.space3),
          TextFormField(
            controller: _bio,
            decoration: const InputDecoration(labelText: 'About you', alignLabelWithHint: true),
            textCapitalization: TextCapitalization.sentences,
            minLines: 3,
            maxLines: 6,
          ),
          const SectionLabel('Skills'),
          TagEditor(tags: _skills, hint: 'Add a skill', onChanged: (t) => setState(() => _skills = t)),
          const SectionLabel('Interests'),
          TagEditor(tags: _interests, hint: 'Add an interest', onChanged: (t) => setState(() => _interests = t)),
          const SectionLabel('Open to'),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('A business partner'),
                  subtitle: const Text('Someone to build a venture with'),
                  value: _business,
                  onChanged: (v) => setState(() => _business = v),
                ),
                const Divider(indent: 16),
                SwitchListTile(
                  title: const Text('An accountability partner'),
                  subtitle: const Text('Someone to stay consistent with in faith and work'),
                  value: _accountability,
                  onChanged: (v) => setState(() => _accountability = v),
                ),
              ],
            ),
          ),
          const SectionLabel('Links'),
          for (final e in _links.entries) ...[
            TextFormField(
              controller: e.value,
              decoration: InputDecoration(labelText: _linkLabels[e.key]),
              keyboardType: TextInputType.url,
              validator: urlError,
            ),
            const SizedBox(height: Tokens.space3),
          ],
          const SizedBox(height: Tokens.space3),
          FilledButton(onPressed: _busy ? null : _save, child: const Text('Save profile')),
        ],
      ),
    );
  }
}
