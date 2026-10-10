import { useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import {
  LuCalendarDays,
  LuDice5,
  LuHeadphones,
  LuHistory,
  LuNotebookPen,
  LuPalette,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import type { Ack, Game } from "../../../shared/types";
import Button from "../components/Button";
import ErrorText from "../components/ErrorText";
import { card, eyebrow, input } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { getName, playerId, saveName, socket } from "../lib/socket";

function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState(getName);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  type Entry = { id: Game; icon: IconType; meta: string; text: string };
  const sections: { title: string; text: string; games: Entry[] }[] = [
    {
      title: t.home.music,
      text: t.home.musicText,
      games: [
        { id: "song", icon: LuHeadphones, meta: t.home.meta, text: t.home.songText },
        { id: "year", icon: LuCalendarDays, meta: t.home.meta, text: t.home.yearText },
        { id: "timeline", icon: LuHistory, meta: t.home.meta, text: t.home.timelineText },
      ],
    },
    {
      title: t.home.classics,
      text: t.home.classicsText,
      games: [
        { id: "slf", icon: LuNotebookPen, meta: t.home.meta, text: t.home.slfText },
        { id: "kniffel", icon: LuDice5, meta: t.home.kniffelMeta, text: t.home.kniffelText },
        { id: "draw", icon: LuPalette, meta: t.home.meta, text: t.home.drawText },
      ],
    },
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
        <ErrorText code={error} />
      </section>

      {sections.map((section) => (
        <section key={section.title} className="pt-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={eyebrow}>{section.title}</h2>
            <p className="text-sm text-(--text-secondary)">{section.text}</p>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {section.games.map(({ id, icon: Icon, meta, text }) => (
              <article key={id} className={`${card} flex flex-col p-6`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--accent) text-xl text-slate-950">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{t.games[id]}</h3>
                    <p className="text-xs text-(--text-secondary)">{meta}</p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm text-(--text-secondary)">{text}</p>
                <Button className="mt-5 w-full" onClick={() => create(id)} disabled={busy}>
                  {t.home.create}
                </Button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default Home;
