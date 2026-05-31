import { SuiteApp } from './SuiteApp';
import { LanguageProvider } from './i18n/LanguageProvider';

function App() {
  return (
    <LanguageProvider>
      <SuiteApp />
    </LanguageProvider>
  );
}

export default App;

