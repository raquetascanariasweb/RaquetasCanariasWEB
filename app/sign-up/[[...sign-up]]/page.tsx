import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0f' }}>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-[#12121a] shadow-none border border-[#1e1e2e]',
            headerTitle: 'text-[#f0f0f5] text-2xl',
            headerSubtitle: 'text-[#6b6b80]',
            socialButtonsBlockButton:
              'bg-transparent border border-[#1e1e2e] text-[#f0f0f5] hover:bg-[#12121a]/50',
            socialButtonsBlockButtonText: 'text-[#f0f0f5] text-sm',
            dividerLine: 'bg-[#1e1e2e]',
            dividerText: 'text-[#6b6b80]/40',
            formFieldLabel: 'text-[#a0a0b0] text-xs',
            formFieldInput:
              'bg-[#0a0a0f] border-[#1e1e2e] text-[#f0f0f5] placeholder:text-[#6b6b80]',
            formButtonPrimary:
              'bg-[#00e5ff] text-[#0a0a0f] hover:bg-[#00e5ff]/90 text-xs uppercase tracking-widest',
            footerActionLink: 'text-[#00e5ff] hover:text-[#00e5ff]/80',
            footerActionText: 'text-[#6b6b80]',
            formFieldErrorText: 'text-[#ff1744]',
          },
        }}
      />
    </div>
  )
}
