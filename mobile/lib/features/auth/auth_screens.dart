import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../data/backend.dart';
import '../../domain/models.dart';

/// Shared layout: logo, a serif headline, then the form.
class _AuthLayout extends StatelessWidget {
  const _AuthLayout({required this.title, required this.subtitle, required this.children, this.showBack = false});
  final String title;
  final String subtitle;
  final List<Widget> children;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showBack ? AppBar() : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: Tokens.space6, vertical: Tokens.space6),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Image.asset(
                        'assets/images/logo.png',
                        height: 92,
                        color: context.theme.brightness == Brightness.dark ? Colors.white : null,
                        colorBlendMode: BlendMode.srcIn,
                        semanticLabel: 'Christians Innovate',
                      ),
                    ),
                    const SizedBox(height: Tokens.space8),
                    Text(title, style: context.displayText(size: 32)),
                    const SizedBox(height: Tokens.space2),
                    Text(subtitle, style: context.text.bodyLarge?.copyWith(color: context.ci.muted)),
                    const SizedBox(height: Tokens.space6),
                    ...children,
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorText extends StatelessWidget {
  const _ErrorText(this.message);
  final String? message;

  @override
  Widget build(BuildContext context) {
    if (message == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: Tokens.space4),
      child: Container(
        padding: const EdgeInsets.all(Tokens.space3),
        decoration: BoxDecoration(color: Tokens.danger.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(Tokens.radiusS)),
        child: Row(
          children: [
            const Icon(Icons.error_outline_rounded, size: 18, color: Tokens.danger),
            const SizedBox(width: Tokens.space2),
            Expanded(
              child: Text(message!, style: context.text.bodyMedium?.copyWith(color: Tokens.danger)),
            ),
          ],
        ),
      ),
    );
  }
}

class _BusyButton extends StatelessWidget {
  const _BusyButton({required this.label, required this.busy, required this.onPressed});
  final String label;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
    onPressed: busy ? null : onPressed,
    child: busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2)) : Text(label),
  );
}

String? _emailError(String? v) => (v == null || !RegExp(r'^\S+@\S+\.\S+$').hasMatch(v.trim())) ? 'Enter your email address' : null;

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});
  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false, _hide = true;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(backendProvider).signIn(_email.text, _password.text);
    } on BackendException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AuthLayout(
      title: 'Welcome back',
      subtitle: 'Pick up your reading where you left off.',
      children: [
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _ErrorText(_error),
              TextFormField(
                key: const Key('email'),
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                validator: _emailError,
              ),
              const SizedBox(height: Tokens.space3),
              TextFormField(
                key: const Key('password'),
                controller: _password,
                obscureText: _hide,
                autofillHints: const [AutofillHints.password],
                decoration: InputDecoration(
                  labelText: 'Password',
                  suffixIcon: IconButton(
                    tooltip: _hide ? 'Show password' : 'Hide password',
                    icon: Icon(_hide ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _hide = !_hide),
                  ),
                ),
                validator: (v) => (v == null || v.isEmpty) ? 'Enter your password' : null,
                onFieldSubmitted: (_) => _submit(),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: () => context.push('/forgot-password'), child: const Text('Forgot password?')),
              ),
              const SizedBox(height: Tokens.space2),
              _BusyButton(label: 'Sign in', busy: _busy, onPressed: _submit),
              const SizedBox(height: Tokens.space6),
              Wrap(
                alignment: WrapAlignment.center,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text('New here?', style: context.text.bodyMedium?.copyWith(color: context.ci.muted)),
                  TextButton(onPressed: () => context.push('/sign-up'), child: const Text('Create an account')),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});
  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _referral = TextEditingController();
  bool _bibleYear = true, _updates = true, _skillShare = false;
  bool _busy = false, _hide = true, _checkEmail = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _email, _password, _referral]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final needsConfirm = await ref
          .read(backendProvider)
          .signUp(
            SignUpDetails(
              fullName: _name.text,
              email: _email.text,
              password: _password.text,
              bibleYear: _bibleYear,
              ciUpdates: _updates,
              skillShare: _skillShare,
              referral: _referral.text,
            ),
          );
      if (mounted && needsConfirm) setState(() => _checkEmail = true);
    } on BackendException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkEmail) {
      return _AuthLayout(
        showBack: true,
        title: 'Check your email',
        subtitle: 'We sent a link to ${_email.text.trim()}. Open it to confirm your account, then sign in.',
        children: [OutlinedButton(onPressed: () => context.go('/sign-in'), child: const Text('Back to sign in'))],
      );
    }
    return _AuthLayout(
      showBack: true,
      title: 'Join the community',
      subtitle: 'Read Scripture daily, pray together, and build with believers.',
      children: [
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _ErrorText(_error),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Full name'),
                textCapitalization: TextCapitalization.words,
                autofillHints: const [AutofillHints.name],
                textInputAction: TextInputAction.next,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter your name' : null,
              ),
              const SizedBox(height: Tokens.space3),
              TextFormField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                validator: _emailError,
              ),
              const SizedBox(height: Tokens.space3),
              TextFormField(
                controller: _password,
                obscureText: _hide,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(
                  labelText: 'Password',
                  helperText: 'At least 8 characters',
                  suffixIcon: IconButton(
                    tooltip: _hide ? 'Show password' : 'Hide password',
                    icon: Icon(_hide ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _hide = !_hide),
                  ),
                ),
                validator: (v) => (v == null || v.length < 8) ? 'Use at least 8 characters' : null,
              ),
              const SizedBox(height: Tokens.space4),
              _Check(
                value: _bibleYear,
                title: 'Read the Bible in a year',
                subtitle: 'Start the community reading plan right away.',
                onChanged: (v) => setState(() => _bibleYear = v),
              ),
              _Check(
                value: _updates,
                title: 'Christians Innovate updates',
                subtitle: 'News, events and meetups by email.',
                onChanged: (v) => setState(() => _updates = v),
              ),
              _Check(
                value: _skillShare,
                title: 'Share my skills',
                subtitle: 'Let other members find you to build together.',
                onChanged: (v) => setState(() => _skillShare = v),
              ),
              const SizedBox(height: Tokens.space3),
              TextFormField(
                controller: _referral,
                decoration: const InputDecoration(labelText: 'Who invited you? (optional)'),
              ),
              const SizedBox(height: Tokens.space6),
              _BusyButton(label: 'Create account', busy: _busy, onPressed: _submit),
            ],
          ),
        ),
      ],
    );
  }
}

class _Check extends StatelessWidget {
  const _Check({required this.value, required this.title, required this.subtitle, required this.onChanged});
  final bool value;
  final String title;
  final String subtitle;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => CheckboxListTile(
    value: value,
    onChanged: (v) => onChanged(v ?? false),
    title: Text(title, style: context.text.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
    subtitle: Text(subtitle, style: context.text.bodySmall),
    contentPadding: EdgeInsets.zero,
    controlAffinity: ListTileControlAffinity.leading,
    visualDensity: VisualDensity.compact,
  );
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _busy = false, _sent = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(backendProvider).sendPasswordReset(_email.text);
      if (mounted) setState(() => _sent = true);
    } on BackendException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_sent) {
      return _AuthLayout(
        showBack: true,
        title: 'Check your email',
        subtitle: 'If there’s an account for ${_email.text.trim()}, a reset link is on its way.',
        children: [OutlinedButton(onPressed: () => context.go('/sign-in'), child: const Text('Back to sign in'))],
      );
    }
    return _AuthLayout(
      showBack: true,
      title: 'Reset your password',
      subtitle: 'Enter your email and we’ll send you a link to choose a new one.',
      children: [
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _ErrorText(_error),
              TextFormField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                validator: _emailError,
                onFieldSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: Tokens.space5),
              _BusyButton(label: 'Send reset link', busy: _busy, onPressed: _submit),
            ],
          ),
        ),
      ],
    );
  }
}
