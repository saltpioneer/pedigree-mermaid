import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { Home } from './pages/Home';

function App() {
  return (
    <Theme accentColor="cyan" appearance="light" radius="large">
      <Home />
    </Theme>
  );
}

export default App;
