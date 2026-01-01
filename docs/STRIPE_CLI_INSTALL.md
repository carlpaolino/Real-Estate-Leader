# Installing Stripe CLI (Alternative Method)

Since Homebrew installation is failing due to Xcode version requirements, here are alternative methods to install the Stripe CLI:

## Method 1: Manual Download (Recommended)

1. **Visit the Stripe CLI Releases Page**
   - Go to: https://github.com/stripe/stripe-cli/releases/latest
   - Or directly: https://github.com/stripe/stripe-cli/releases

2. **Download the Correct Binary**
   - For macOS ARM64 (Apple Silicon): Download `stripe_X.X.X_darwin_arm64.tar.gz`
   - For macOS Intel: Download `stripe_X.X.X_darwin_amd64.tar.gz`
   - Check your architecture: `uname -m` (arm64 = Apple Silicon, x86_64 = Intel)

3. **Extract and Install**
   ```bash
   # Extract the downloaded file
   tar -xzf stripe_X.X.X_darwin_arm64.tar.gz
   
   # Install to your user directory (no sudo needed)
   mkdir -p ~/bin
   mv stripe ~/bin/
   
   # Remove macOS quarantine attribute (required for downloaded binaries)
   xattr -d com.apple.quarantine ~/bin/stripe
   
   # Add to PATH
   echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Verify Installation**
   ```bash
   stripe --version
   ```

## Method 2: Using npm (if you have Node.js)

```bash
npm install -g stripe-cli
```

## Method 3: Using Go (if you have Go installed)

```bash
go install github.com/stripe/stripe-cli@latest
```

## After Installation: Login to Stripe

Once installed, login to your Stripe account:

```bash
stripe login
```

This will open your browser to authenticate. After authentication, you'll get a message like:
```
Done! The Stripe CLI is configured for your account
```

## Testing Webhook Forwarding

Once installed and logged in, you can forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret (starts with `whsec_`). Add this to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Troubleshooting

### macOS Security Warning ("stripe" Not Opened)
If macOS blocks the Stripe CLI with a security warning:
```bash
# Remove the quarantine attribute
xattr -d com.apple.quarantine ~/bin/stripe
```
This allows macOS to run the binary without the security warning.

### If you get "command not found"
- Make sure the `stripe` binary is in your PATH
- Try: `which stripe` to check if it's found
- Add the directory containing `stripe` to your PATH in `~/.zshrc`
- Reload your shell: `source ~/.zshrc` or open a new terminal

### If webhook forwarding doesn't work
- Make sure your Next.js dev server is running on port 3000
- Check that the webhook endpoint is accessible
- Verify the webhook secret is correctly set in your `.env.local`

## Quick Test

After installation, test that everything works:

```bash
# Check version
stripe --version

# Login (if not already logged in)
stripe login

# Test webhook forwarding (in a separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then in your main terminal, trigger a test event:
```bash
stripe trigger checkout.session.completed
```

You should see the event forwarded to your local server!

