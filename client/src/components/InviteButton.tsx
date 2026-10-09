import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { useLanguage } from "../lib/i18n";
import Button from "./Button";

/** Kopiert den Einladungslink zum Raum in die Zwischenablage. */
interface InviteButtonProps {
  code: string;
  /** Kurze Beschriftung für schmale Spalten. */
  short?: boolean;
  className?: string;
}

function InviteButton({ code, short = false, className = "" }: InviteButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(`${location.origin}/r/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button variant="secondary" size="small" onClick={copy} className={className}>
      {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      {copied ? t.lobby.copied : short ? t.lobby.copyShort : t.lobby.copy}
    </Button>
  );
}

export default InviteButton;
