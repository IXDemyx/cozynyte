import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { useLanguage } from "../lib/i18n";
import Button from "./Button";

/** Kopiert den Einladungslink zum Raum in die Zwischenablage. */
function InviteButton({ code }: { code: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(`${location.origin}/r/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button variant="secondary" size="small" onClick={copy}>
      {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      {copied ? t.lobby.copied : t.lobby.copy}
    </Button>
  );
}

export default InviteButton;
