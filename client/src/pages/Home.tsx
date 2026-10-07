import { useState, type FormEvent } from "react";
import { FiImage, FiMusic, FiPenTool } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import type { Ack } from "../../../shared/types";
import Button from "../components/Button";
import { card, chip, eyebrow, input } from "../components/ui";
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
    <div className="animate-in">
      <section className="py-10 sm:py-16">
        <p className={eyebrow}>{t.home.eyebrow}</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          {t.home.titleStart}
          <span className="text-(--accent)">{t.home.titleAccent}</span>
          {t.home.titleEnd}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-(--text-secondary)">
          {t.home.lead}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className={`${card} p-7 lg:col-span-3`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--accent) text-xl text-slate-950">
              <FiMusic aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Guess the Song</h2>
              <p className="text-sm text-(--text-secondary)">{t.home.meta}</p>
            </div>
          </div>
          <p className="mt-5 leading-7 text-(--text-secondary)">
            {t.home.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {t.home.tags.map((tag) => (
              <span key={tag} className={chip}>
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-7 border-t border-slate-200 pt-6 dark:border-(--accent-soft)">
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

        <div className="space-y-6 lg:col-span-2">
          {upcoming.map(({ icon: Icon, title, text }) => (
            <article key={title} className={`${card} p-6 opacity-70`}>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-(--text-secondary) dark:border-(--accent-border)">
                  <Icon aria-hidden="true" />
                </span>
                <span className={chip}>{t.home.soon}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold tracking-tight">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-(--text-secondary)">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
