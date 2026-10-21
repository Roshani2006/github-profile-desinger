"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleHelp, Code2, Copy, ExternalLink, Eye, Github, Globe2, Heart, ImagePlus,
  Layers3, LoaderCircle, LockKeyhole, LogOut, Mail, Palette, Plus, RefreshCw,
  Sparkles, WandSparkles, X,
} from "lucide-react";
import { generateAssets } from "@/lib/profile-assets";
import { themeColors, type Profile } from "@/lib/profile";

type Repo = { name: string; fullName: string; description: string | null; url: string; homepage: string | null; language: string | null; stars: number; forks: number; updatedAt: string | null; isProfile: boolean };
type GithubSnapshot = {
  user: { login: string; name: string | null; bio: string | null; location: string | null; email: string | null; website: string | null; company: string | null; twitter: string | null; avatar: string };
  repositories: Repo[];
  projects: Profile["projects"];
  stats: Profile["githubStats"];
};
type PublishResult = { repository: string; branch: string; files: string[] };

const styles: { value: Profile["style"]; label: string; note: string; swatches: string[] }[] = [
  { value: "dark", label: "Dark premium", note: "Quiet depth, luminous detail", swatches: ["#8de5dc", "#a3aaff", "#f3f5f7"] },
  { value: "cyberpunk", label: "Cyberpunk", note: "Voltage, contrast, motion", swatches: ["#5ee9ff", "#ff5ebc", "#a3ff7e"] },
  { value: "futuristic", label: "Future form", note: "Architectural and precise", swatches: ["#74d7f0", "#9a9cff", "#e9edf4"] },
  { value: "luxury", label: "Minimal luxury", note: "Considered, warm, refined", swatches: ["#eacb86", "#dfb4a7", "#f3eee7"] },
  { value: "anime", label: "Anime / cinematic", note: "A story in every frame", swatches: ["#f38abe", "#a595ff", "#78e4df"] },
  { value: "gaming", label: "Gaming", note: "A little more game face", swatches: ["#74e4b1", "#8ab1ff", "#f2ec7d"] },
  { value: "minimal", label: "Soft minimal", note: "Less noise, more signal", swatches: ["#dbe2e9", "#93a3ad", "#82cfc2"] },
];

const defaults: Profile = {
  name: "Alex Morgan", username: "", headline: "Product-minded developer & creative technologist",
  bio: "I turn curious ideas into useful, human-centered digital experiences. Currently exploring the edges between design and code.",
  location: "", email: "", website: "", company: "", linkedin: "", instagram: "", twitter: "", github: "",
  skills: ["TypeScript", "React", "Next.js", "Node.js", "Figma", "PostgreSQL"],
  projects: [],
  githubStats: { followers: 0, following: 0, publicRepos: 0, stars: 0, forks: 0, contributions: null, contributionYear: new Date().getFullYear(), contributionWeeks: [], languages: [] },
  style: "dark", persona: "neutral", mood: "aurora", animation: "medium", aesthetic: "developer",
  repository: "", photo: "", originalReadme: "",
};

function Field({ label, value, onChange, placeholder, type = "text", readOnly = false, icon: Icon }: {
  label: string; value: string; onChange?: (value: string) => void; placeholder?: string; type?: string; readOnly?: boolean;
  icon?: typeof Github;
}) {
  return <label className="field"><span className="field-label">{label}</span><span className={`input-wrap ${readOnly ? "is-readonly" : ""}`}>{Icon && <Icon size={14} />}
    <input type={type} value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} readOnly={readOnly} />
    {readOnly && <LockKeyhole size={13} className="field-lock" />}
  </span></label>;
}

function PreviewPanel({ profile, readme, onDownload }: { profile: Profile; readme: string; onDownload: () => void }) {
  const [tab, setTab] = useState<"profile" | "readme">("profile");
  const colors = themeColors(profile);
  const banner = useMemo(() => generateAssets(profile).assets["hero.svg"], [profile]);
  const [copied, setCopied] = useState(false);

  async function copyReadme() {
    await navigator.clipboard.writeText(readme);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <aside className="preview-column">
    <div className="preview-sticky">
      <div className="preview-heading"><div><span className="eyebrow">LIVE CANVAS</span><h2>Profile preview</h2></div><span className="live-indicator"><i /> LIVE</span></div>
      <div className="preview-shell">
        <div className="preview-toolbar"><div className="window-dots"><i /><i /><i /></div><span className="preview-address"><Github size={12} /> github.com/{profile.username || "your-handle"}</span><button className="icon-button preview-open" title="Preview GitHub profile" onClick={() => window.open(`https://github.com/${profile.username}`, "_blank", "noopener,noreferrer")}><ExternalLink size={14} /></button></div>
        <div className="preview-tabs"><button className={tab === "profile" ? "selected" : ""} onClick={() => setTab("profile")}><Eye size={13} /> Profile</button><button className={tab === "readme" ? "selected" : ""} onClick={() => setTab("readme")}><BookOpen size={13} /> README</button></div>
        {tab === "profile" ? <div className="profile-preview">
          <div className="repo-path"><Github size={14} /><strong>{profile.username || "your-handle"}</strong><span>/</span><strong>{profile.repository || profile.username || "your-repo"}</strong><span className="public-pill">Public</span></div>
            <div className="preview-hero" style={{ "--accent": colors.accent } as React.CSSProperties}>
            <Image className="preview-banner" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(banner)}`} alt={`Generated profile banner for ${profile.name}`} width={1200} height={340} unoptimized />
          </div>
          <div className="preview-stats"><div><span>CONTRIBUTIONS</span><b>{profile.githubStats.contributions ?? "Unavailable"}</b></div><div><span>FOLLOWERS</span><b>{profile.githubStats.followers}</b></div><div><span>REPO STARS</span><b>{profile.githubStats.stars}</b></div></div>
          <div className="preview-section-label"><span>✦</span> FEATURED BUILDS · {profile.projects.length} OF {profile.githubStats.publicRepos} PUBLIC REPOS</div>
          {profile.projects.slice(0, 2).map((project, index) => <div className="preview-project" key={`${index}-${project.name}`}><div className="project-mark"><Code2 size={15} /></div><div><strong>{project.name || "Project name"}</strong><p>{project.description || "Public repository"}</p><small>{project.stack || "Add your stack"} · ★ {project.stars}</small></div><ArrowUpRight size={14} /></div>)}
          <div className="preview-stack-row">{profile.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div>
        </div> : <div className="readme-preview"><pre>{readme.slice(0, 5200)}{readme.length > 5200 ? "\n\n…" : ""}</pre></div>}
        <div className="preview-actions"><button className="preview-action" onClick={copyReadme}><Copy size={13} />{copied ? "Copied" : "Copy markdown"}</button><button className="preview-action" onClick={onDownload}><ArrowDownToLine size={14} />Download README</button></div>
      </div>
      <div className="preview-note"><Sparkles size={14} /><span>Every detail updates as you create.</span><span className="preview-note-dot">·</span><span>{profile.style.replace("-", " ")} / {profile.persona}</span></div>
    </div>
  </aside>;
}

export function ProfileStudio() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile>(defaults);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [skillsText, setSkillsText] = useState(defaults.skills.join(", "));
  const [syncing, setSyncing] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const editedFields = useRef(new Set<keyof Profile>());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PublishResult | null>(null);
  const [beautify, setBeautify] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const login = session?.user?.githubLogin || "";
  const assets = useMemo(() => generateAssets(profile), [profile]);

  useEffect(() => {
    const stored = localStorage.getItem("profile-atelier-draft-v1");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<Profile>;
        const restored = { ...defaults, ...parsed, username: login || parsed.username || "" };
        const savedEdits = localStorage.getItem("profile-atelier-edited-v1");
        if (savedEdits) {
          const keys = JSON.parse(savedEdits) as string[];
          for (const key of keys) if (key in defaults) editedFields.current.add(key as keyof Profile);
        } else {
          for (const key of Object.keys(parsed) as (keyof Profile)[]) {
            if (JSON.stringify(parsed[key]) !== JSON.stringify(defaults[key])) editedFields.current.add(key);
          }
        }
        setProfile(restored);
        setSkillsText(restored.skills.join(", "));
      } catch { localStorage.removeItem("profile-atelier-draft-v1"); }
    }
    setDraftReady(true);
  }, [login]);

  useEffect(() => {
    if (status !== "authenticated" || !draftReady) return;
    const controller = new AbortController();
    setSyncing(true);
    fetch("/api/github/repos", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("GitHub profile data could not be loaded.");
        return response.json() as Promise<GithubSnapshot>;
      })
      .then((snapshot) => {
        setRepos(snapshot.repositories);
        if (!editedFields.current.has("skills") && snapshot.stats.languages.length) setSkillsText(snapshot.stats.languages.join(", "));
        setProfile((current) => {
          const edited = editedFields.current;
          const next = {
            ...current,
            username: snapshot.user.login,
            name: edited.has("name") ? current.name : snapshot.user.name || snapshot.user.login,
            bio: edited.has("bio") ? current.bio : snapshot.user.bio || current.bio,
            location: edited.has("location") ? current.location : snapshot.user.location || current.location,
            email: edited.has("email") ? current.email : snapshot.user.email || current.email,
            website: edited.has("website") ? current.website : snapshot.user.website || current.website,
            company: edited.has("company") ? current.company : snapshot.user.company || current.company,
            twitter: edited.has("twitter") ? current.twitter : snapshot.user.twitter ? `https://x.com/${snapshot.user.twitter}` : current.twitter,
            github: `https://github.com/${snapshot.user.login}`,
            photo: edited.has("photo") ? current.photo : snapshot.user.avatar || current.photo,
            projects: edited.has("projects") ? current.projects : snapshot.projects,
            skills: edited.has("skills") || snapshot.stats.languages.length === 0 ? current.skills : snapshot.stats.languages,
            repository: edited.has("repository") ? current.repository : current.repository || (snapshot.repositories.find((repo) => repo.isProfile)?.name ?? snapshot.user.login),
            githubStats: snapshot.stats,
          };
          return next;
        });
      })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "GitHub profile sync failed."); })
      .finally(() => { if (!controller.signal.aborted) setSyncing(false); });
    return () => controller.abort();
  }, [status, login, draftReady, syncVersion]);

  useEffect(() => {
    if (draftReady) {
      localStorage.setItem("profile-atelier-draft-v1", JSON.stringify(profile));
      localStorage.setItem("profile-atelier-edited-v1", JSON.stringify(Array.from(editedFields.current)));
    }
  }, [profile, draftReady]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    editedFields.current.add(key);
    setProfile((current) => ({ ...current, [key]: value }));
    setResult(null);
  }

  function downloadReadme() {
    const blob = new Blob([assets.readme], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "README.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Choose an image file for your avatar."); return; }
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    update("photo", canvas.toDataURL("image/jpeg", 0.78));
    setMessage("");
  }

  function randomize() {
    const options = styles.map((style) => style.value).filter((style) => style !== profile.style);
    const mood: Profile["mood"][] = ["aurora", "rose", "electric", "gold", "mono"];
    const animations: Profile["animation"][] = ["subtle", "medium", "bold"];
    update("style", options[Math.floor(Math.random() * options.length)]);
    setProfile((current) => ({ ...current, mood: mood[Math.floor(Math.random() * mood.length)], animation: animations[Math.floor(Math.random() * animations.length)] }));
  }

  async function publish() {
    if (!session) { await signIn("github"); return; }
    if (!profile.name.trim() || !profile.headline.trim()) { setMessage("Add your name and headline before publishing."); return; }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/generate-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, skills: skillsText.split(",").map((skill) => skill.trim()).filter(Boolean) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not publish this profile.");
      setResult(body as PublishResult);
      setMessage(`Published ${body.files.length} files to ${body.repository.replace("https://github.com/", "")}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish this profile.");
    } finally { setBusy(false); }
  }

  const hasOriginal = Boolean(profile.originalReadme.trim());

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Layers3 size={17} /></span><span>profile<span className="brand-light">atelier</span><i>.</i></span></a>
      <nav className="top-nav"><a href="#studio">Studio</a><a href="#templates">Templates</a><a href="https://github.com/Meghamittal0920/Meghamittal0920" target="_blank" rel="noreferrer">Inspiration <ArrowUpRight size={12} /></a></nav>
      <div className="account-actions">{session ? <><span className="account-avatar">{session.user?.image ? <Image src={session.user.image} alt="" width={27} height={27} unoptimized /> : <Github size={14} />}</span><span className="account-name">{login}</span><button className="logout-button" onClick={() => signOut()} title="Sign out"><LogOut size={15} /></button></> : <button className="sign-in-button" onClick={() => signIn("github")}><Github size={15} /> Connect GitHub <ArrowRight size={14} /></button>}</div>
    </header>

    <main id="top">
      <section className="workspace-hero"><div className="hero-topline"><span className="hero-eyebrow"><i /> YOUR PROFILE, RECOMPOSED</span><span className="hero-edition">A CREATIVE TOOL FOR DEVELOPERS <span>·</span> VOL. 01</span></div>
        <div className="hero-heading-row"><h1>Make your GitHub<br /><span>feel like you.</span></h1><div className="hero-aside"><p>A profile with a point of view. Build your README, art panels and contribution story in one considered workspace.</p><a href="#studio">Enter the studio <ArrowDownToLine size={14} /></a></div></div>
        <div className="hero-bottomline"><span><Sparkles size={13} /> A little more personality. A lot more you.</span><span>DESIGNED FOR YOUR NEXT CHAPTER <span className="tiny-square" /></span></div>
      </section>

      {!session && <section className="connect-banner"><div className="connect-icon"><Github size={20} /></div><div><strong>Your canvas is ready.</strong><p>Connect GitHub to pull your public repositories and publish your finished profile.</p></div><button onClick={() => signIn("github")}>Connect account <ArrowRight size={14} /></button><span className="connect-lock"><LockKeyhole size={13} /> Tokens stay server-side</span></section>}

      <section className="studio-layout" id="studio">
        <div className="form-column">
          <div className="studio-title-row"><div><span className="eyebrow">THE WORKSPACE</span><h2>Profile studio</h2></div><button className="text-action randomize-button" onClick={randomize}><WandSparkles size={14} /> Randomize style</button></div>
          <section className="form-section"><div className="section-heading"><span className="section-index">01</span><div><h3>The essentials</h3><p>A name, an idea, a place to begin.</p></div><BadgeCheck size={16} /></div>
            <div className="field-grid"><Field label="Full name" value={profile.name} onChange={(value) => update("name", value)} placeholder="Your name" /><Field label="GitHub username" value={login || profile.username} readOnly icon={Github} placeholder="Connect GitHub" /><Field label="Title / headline" value={profile.headline} onChange={(value) => update("headline", value)} placeholder="What you do, in a line" /><Field label="Location" value={profile.location} onChange={(value) => update("location", value)} placeholder="City, country" /><Field label="Company" value={profile.company} onChange={(value) => update("company", value)} placeholder="Organization or team" /><button className="sync-button" onClick={() => setSyncVersion((version) => version + 1)} disabled={!session || syncing}><RefreshCw size={13} className={syncing ? "spin" : ""} />{syncing ? "Syncing GitHub data" : "Refresh GitHub data"}</button></div>
            <label className="field full-field"><span className="field-label">A few words about you</span><textarea value={profile.bio} onChange={(event) => update("bio", event.target.value)} maxLength={500} placeholder="What are you curious about? What do you love building?" rows={3} /><span className="character-count">{profile.bio.length}/500</span></label>
            <div className="social-grid"><Field label="Email" value={profile.email} onChange={(value) => update("email", value)} placeholder="you@example.com" type="email" icon={Mail} /><Field label="Personal website" value={profile.website} onChange={(value) => update("website", value)} placeholder="yourname.dev" icon={Globe2} /><Field label="LinkedIn" value={profile.linkedin} onChange={(value) => update("linkedin", value)} placeholder="linkedin.com/in/you" /><Field label="X / Twitter" value={profile.twitter} onChange={(value) => update("twitter", value)} placeholder="x.com/you" /><Field label="Instagram" value={profile.instagram} onChange={(value) => update("instagram", value)} placeholder="instagram.com/you" /><Field label="GitHub profile" value={profile.github || (login ? `https://github.com/${login}` : "")} onChange={(value) => update("github", value)} placeholder="github.com/you" /></div>
          </section>

          <section className="form-section"><div className="section-heading"><span className="section-index">02</span><div><h3>Your visual language</h3><p>Choose a direction. Fine-tune the feeling.</p></div><Palette size={16} /></div>
            <div className="style-grid">{styles.map((style) => <button key={style.value} className={`style-card ${profile.style === style.value ? "active" : ""}`} onClick={() => update("style", style.value)}><span className="style-swatches">{style.swatches.map((color) => <i key={color} style={{ background: color }} />)}</span><strong>{style.label}</strong><small>{style.note}</small>{profile.style === style.value && <span className="style-check"><Check size={11} /></span>}</button>)}</div>
            <div className="choice-row"><div className="choice-group"><span className="field-label">PERSONA</span><div className="segmented">{(["female", "male", "neutral"] as const).map((persona) => <button className={profile.persona === persona ? "active" : ""} key={persona} onClick={() => update("persona", persona)}>{persona === "female" ? "Feminine" : persona === "male" ? "Masculine" : "Neutral"}</button>)}</div></div><div className="choice-group"><span className="field-label">PALETTE</span><div className="palette-picker">{(["aurora", "rose", "electric", "gold", "mono"] as const).map((mood) => <button key={mood} title={mood} aria-label={`${mood} palette`} className={`palette-dot ${profile.mood === mood ? "active" : ""}`} onClick={() => update("mood", mood)} style={{ "--swatch": themeColors({ ...profile, mood }).accent } as React.CSSProperties} />)}</div></div></div>
            <div className="choice-row lower-choice"><div className="choice-group"><span className="field-label">MOTION</span><div className="segmented">{(["subtle", "medium", "bold"] as const).map((value) => <button className={profile.animation === value ? "active" : ""} key={value} onClick={() => update("animation", value)}>{value}</button>)}</div></div><div className="choice-group"><span className="field-label">CREATIVE DIRECTION</span><div className="segmented"><button className={profile.aesthetic === "developer" ? "active" : ""} onClick={() => update("aesthetic", "developer")}><Code2 size={12} /> Developer</button><button className={profile.aesthetic === "creative" ? "active" : ""} onClick={() => update("aesthetic", "creative")}><Heart size={12} /> Creative</button></div></div></div>
          </section>

          <section className="form-section"><div className="section-heading"><span className="section-index">03</span><div><h3>What you work with</h3><p>Your favorite tools, not every tool.</p></div><Code2 size={16} /></div>
            <label className="field full-field"><span className="field-label">TECH STACK <span className="label-hint">Separate each skill with a comma</span></span><div className="input-wrap skill-input"><Code2 size={14} /><input value={skillsText} onChange={(event) => { setSkillsText(event.target.value); update("skills", event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean)); }} placeholder="TypeScript, React, Figma" /></div></label>
            <div className="project-heading"><div><span className="field-label">FEATURED PROJECTS</span><span className="label-hint">Up to 6 projects · imported from public repositories</span></div><button className="add-project" onClick={() => update("projects", [...profile.projects, { name: "", description: "", stack: "", url: "", demo: "", stars: 0 }].slice(0, 6))} disabled={profile.projects.length >= 6}><Plus size={13} /> Add project</button></div>
            <div className="project-editor-list">{profile.projects.map((project, index) => <div className="project-editor" key={index}><span className="project-number">{String(index + 1).padStart(2, "0")}</span><div className="project-fields"><input aria-label="Project name" value={project.name} onChange={(event) => update("projects", profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Project name" /><input aria-label="Project description" value={project.description} onChange={(event) => update("projects", profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} placeholder="One-line description" /><div className="project-inline"><input aria-label="Project stack" value={project.stack} onChange={(event) => update("projects", profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, stack: event.target.value } : item))} placeholder="Stack: React · Node" /><input aria-label="Project repository URL" value={project.url} onChange={(event) => update("projects", profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="Repository URL" /><input aria-label="Project demo URL" value={project.demo} onChange={(event) => update("projects", profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, demo: event.target.value } : item))} placeholder="Live demo URL" /></div></div>{profile.projects.length > 1 && <button className="remove-project" title="Remove project" onClick={() => update("projects", profile.projects.filter((_, itemIndex) => itemIndex !== index))}><X size={14} /></button>}</div>)}</div>
          </section>

          <section className="form-section"><div className="section-heading"><span className="section-index">04</span><div><h3>Your portrait</h3><p>A small human detail makes it yours.</p></div><ImagePlus size={16} /></div>
            <div className="upload-row"><label className="upload-button">{profile.photo ? <Image src={profile.photo} alt="Selected avatar" width={25} height={25} unoptimized /> : <ImagePlus size={18} />}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} /><span>{profile.photo ? "Change portrait" : "Upload a portrait"}</span></label><span className="upload-note">PNG, JPG or WebP · Cropped and optimized in your browser.</span>{profile.photo && <button className="remove-photo" onClick={() => update("photo", "")}>Remove</button>}</div>
          </section>

          <section className="form-section publish-section"><div className="section-heading"><span className="section-index">05</span><div><h3>Publish to GitHub</h3><p>Your profile repo, ready for its close-up.</p></div><Github size={16} /></div>
            <div className="publish-fields"><label className="field"><span className="field-label">DESTINATION REPOSITORY</span><span className="input-wrap repo-select-wrap"><Github size={14} /><select value={profile.repository} onChange={(event) => update("repository", event.target.value)}><option value="">Choose a public repo</option>{repos.map((repo) => <option key={repo.fullName} value={repo.name}>{repo.name}{repo.isProfile ? " · profile repo" : ""}</option>)}</select><ChevronDown size={13} /></span></label><Field label="Or create / use a repository" value={profile.repository} onChange={(value) => update("repository", value)} placeholder={login || "repository-name"} /></div>
            {login && <div className="repo-note"><LockKeyhole size={13} /><span>Publishing as <strong>{login}</strong>. A new public repository will be created if it does not exist.</span></div>}
            <div className="beautify-row"><div className="beautify-copy"><span className="beautify-icon"><RefreshCw size={14} /></span><div><strong>Beautify an existing README</strong><small>Keep your writing. Give it a new frame.</small></div></div><label className={`toggle ${beautify ? "on" : ""}`}><input type="checkbox" checked={beautify} onChange={(event) => { setBeautify(event.target.checked); if (!event.target.checked) update("originalReadme", ""); }} /><span /></label></div>
            {beautify && <label className="field full-field readme-import"><span className="field-label">PASTE YOUR CURRENT README</span><textarea rows={4} maxLength={12000} value={profile.originalReadme} onChange={(event) => update("originalReadme", event.target.value)} placeholder="# About me&#10;Share your existing README markdown here. Your text will appear after the new visual profile." /></label>}
            {message && <div className={`form-message ${result ? "success" : ""}`}>{result ? <Check size={14} /> : <CircleHelp size={14} />}{message}{result && <a href={result.repository} target="_blank" rel="noreferrer">View on GitHub <ArrowUpRight size={13} /></a>}</div>}
            <div className="publish-actions"><button className="publish-button" onClick={publish} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : result ? <Check size={16} /> : <Sparkles size={16} />}{busy ? "Publishing your profile" : result ? "Published to GitHub" : session ? "Generate & publish profile" : "Connect GitHub to publish"}<ArrowRight size={15} /></button><button className="download-button" onClick={downloadReadme}><ArrowDownToLine size={15} /> Download README</button></div>
          </section>
          <section className="template-gallery" id="templates"><div className="section-heading"><span className="section-index">✳</span><div><h3>Pick up a new mood</h3><p>Start with a point of view. Make it yours.</p></div><Sparkles size={16} /></div><div className="template-strip">{[{ name: "Afterglow", mood: "rose" as const, style: "luxury" as const }, { name: "Signal / Noise", mood: "electric" as const, style: "cyberpunk" as const }, { name: "Slow Sunday", mood: "aurora" as const, style: "minimal" as const }].map((template, index) => <button key={template.name} className="template-card" onClick={() => { setProfile((current) => ({ ...current, mood: template.mood, style: template.style })); setResult(null); }}><span className={`template-art art-${index}`}><i /><i /><i /><span>{template.name.slice(0, 1)}</span></span><span className="template-meta"><strong>{template.name}</strong><small>{template.style} / {template.mood}</small></span><ArrowUpRight size={14} /></button>)}</div></section>
          <div className="footer-note"><span>MADE FOR PEOPLE WHO BUILD THINGS.</span><span><a href="https://docs.github.com/en/apps/oauth-apps" target="_blank" rel="noreferrer">OAuth permissions</a><span>·</span><a href="https://github.com/yoshi389111/github-profile-3d-contrib" target="_blank" rel="noreferrer">Contribution art</a></span></div>
        </div>
        <PreviewPanel profile={profile} readme={assets.readme} onDownload={downloadReadme} />
      </section>
    </main>
  </div>;
}