import { useSession } from '@/hooks/useSession';
import LmsWorkspace from '@/components/LmsWorkspace';
import SignInPage from '@/pages/SignInPage';
import StatusMessage from '@/components/StatusMessage';

function App() {
  const { status, member, signOut } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <StatusMessage variant="loading" message="Checking your sign-in..." />
        </div>
      </div>
    );
  }

  if (status === 'signed-out' || !member) return <SignInPage />;

  return <LmsWorkspace member={member} onSignOut={signOut} />;
}

export default App;
