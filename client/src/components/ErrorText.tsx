import { useLanguage } from "../lib/i18n";

/** Übersetzte Fehlermeldung zu einem Fehlercode; zeigt nichts, solange kein Fehler da ist. */
function ErrorText({ code, className = "mt-4" }: { code: string; className?: string }) {
  const { err } = useLanguage();
  if (!code) return null;
  return (
    <p role="alert" className={`${className} text-sm font-medium text-red-500`}>
      {err(code)}
    </p>
  );
}

export default ErrorText;
