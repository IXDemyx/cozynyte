import { useState, type FormEvent } from "react";
import { FaDiceFive } from "react-icons/fa";
import { FiCalendar, FiMusic, FiPenTool } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import type { Ack, Game } from "../../../shared/types";
import Button from "../components/Button";
import { card, chip, input } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { getName, playerId, saveName, socket } from "../lib/socket";

function Home() {
  const { t, err } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState(getName);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const games = [
    { id: "song" as Game, icon: FiMusic, title: "Guess the Song", meta: t.home.meta, text: t.home.songText },
    { id: "year" as Game, icon: FiCalendar, title: "Guess the Year", meta: t.home.meta, text: t.home.yearText },
    { id: "kniffel" as Game, icon: FaDiceFive, title: t.home.kniffelTitle, meta: t.home.kniffelMeta, text: t.home.kniffelText },
  ];
  const validName = name.trim().length > 0;

  const create = (game: Game) => {
    if (!validName) return setError("name_required");
    saveName(name);
    setBusy(true);
    setError("");
    socket
      .timeout(6000)
      .emit(
        "room:create",
        { name: name.trim(), playerId, game },
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
    <div className="animate-in space-y-6">
      <section className={`${card} p-6`}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
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
          </div>
          <form onSubmit={join}>
            <label htmlFor="code" className="text-sm font-semibold">
              {t.home.joinTitle}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="code"
                className={`${input} font-mono uppercase tracking-[0.3em]`}
                value={code}
                maxLength={4}
                placeholder="CODE"
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
              />
              <Button type="submit" variant="secondary">
                {t.home.join}
              </Button>
            </div>
          </form>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-500">
            {err(error)}
          </p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {games.map(({ id, icon: Icon, title, meta, text }) => (
          <article key={id} className={`${card} flex flex-col p-6`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--accent) text-xl text-slate-950">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                <p className="text-xs text-(--text-secondary)">{meta}</p>
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm text-(--text-secondary)">{text}</p>
            <Button className="mt-5 w-full" onClick={() => create(id)} disabled={busy}>
              {t.home.create}
            </Button>
          </article>
        ))}

        <article className={`${card} flex flex-col p-6 opacity-70`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl text-(--text-secondary) dark:border-(--accent-border)">
              <FiPenTool aria-hidden="true" />
            </span>
            <h2 className="flex-1 text-lg font-bold tracking-tight">Draw & Guess</h2>
            <span className={chip}>{t.home.soon}</span>
          </div>
          <p className="mt-4 text-sm text-(--text-secondary)">{t.home.drawText}</p>
        </article>
      </div>
    </div>
  );
}

export default Home;
