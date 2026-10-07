import { useState, type FormEvent } from "react";
import { FiImage, FiMusic, FiPenTool } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import type { Ack } from "../../../shared/types";
import Button from "../components/Button";
import { card, chip, input } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { getName, playerId, saveName, socket } from "../lib/socket";

function Home() {
  const { t, err } = useLanguage();
  const upcoming = [
    { icon: FiImage, title: "Guess the Cover", text: t.home.coverText },
    { icon: FiPenTool, title: "Draw & Guess", text: t.home.drawText },
  ];
  const navigate = useNavigate();
  const [name, setName] = useState(getName);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const validName = name.trim().length > 0;

  const create = () => {
    if (!validName) return setError("name_required");
    saveName(name);
    setBusy(true);
    setError("");
    socket
      .timeout(6000)
      .emit(
        "room:create",
        { name: name.trim(), playerId },
        (failure: Error | null, res: Ack<{ code: string }>) => {
          setBusy(false);
          if (failure) return setError("server_unreachable");
          if (!res.ok) return setError(res.error);
          navigate(`/r/${res.code}`);
        },
      );
  };

  const join = (event: FormEvent) => {
    event.preventDefault();
    if (!validName) return setError("name_required");
    if (code.length !== 4) return setError("code_length");
    saveName(name);
    navigate(`/r/${code}`);
  };

  return (
    <div className="animate-in grid gap-6 lg:grid-cols-5">
      <article className={`${card} p-7 lg:col-span-3`}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--accent) text-xl text-slate-950">
            <FiMusic aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Guess the Song</h1>
            <p className="text-sm text-(--text-secondary)">{t.home.meta}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-(--text-secondary)">{t.home.songText}</p>

        <div className="mt-6">
          <label htmlFor="name" className="text-sm font-semibold">
            {t.home.name}
          </label>
          <input
            id="name"
            className={`${input} mt-2`}
            value={name}
            maxLength={16}
            autoComplete="nickname"
            placeholder={t.home.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Button onClick={create} disabled={busy}>
              {t.home.create}
            </Button>
            <span className="hidden pb-3 text-sm text-(--text-secondary) sm:block">{t.home.or}</span>
            <form onSubmit={join} className="flex flex-1 gap-2">
              <input
                aria-label={t.home.code}
                className={`${input} font-mono uppercase tracking-[0.3em]`}
                value={code}
                maxLength={4}
                placeholder="CODE"
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
              />
              <Button type="submit" variant="secondary">
                {t.home.join}
              </Button>
            </form>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-500">
              {err(error)}
            </p>
          )}
        </div>
      </article>

      <div className="grid gap-6 lg:col-span-2">
        {upcoming.map(({ icon: Icon, title, text }) => (
          <article key={title} className={`${card} flex items-center gap-3 p-6 opacity-70`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl text-(--text-secondary) dark:border-(--accent-border)">
              <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight">{title}</h2>
              <p className="text-sm text-(--text-secondary)">{text}</p>
            </div>
            <span className={chip}>{t.home.soon}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Home;
