import { escapeXml, markdownText, markdownUrl, photoDataUri, themeColors, type Profile } from "@/lib/profile";

function panel(profile: Profile, width: number, height: number, content: string) {
  const colors = themeColors(profile);
  content = content.replace(/<foreignObject x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"><div[^>]*>[\s\S]*?<\/div><\/foreignObject>/g, (_match, x, y, blockWidth, blockHeight) =>
    svgParagraph(profile.bio || "I build thoughtful digital experiences and share what I learn along the way.", Number(x), Number(y), Number(blockWidth), Number(blockHeight), "#aeb8c4"),
  );
  if (width === 1200 && height === 340) {
    const duration = profile.animation === "bold" ? 2.8 : profile.animation === "subtle" ? 8 : 5;
    content = content.replace('fill="url(#glow)"/>', `fill="url(#glow)"><animate attributeName="opacity" values=".55;.95;.55" dur="${duration}s" repeatCount="indefinite"/></circle>`);
  }
  const motif = profile.style === "cyberpunk"
    ? `<path d="M${width - 250} 0v50l35 35h45v65l-28 28v90" stroke="${colors.accent}" stroke-opacity=".12"/><path d="M${width - 110} 0v34l-26 26v66l34 34v65" stroke="${colors.second}" stroke-opacity=".12"/>`
    : profile.style === "luxury"
      ? `<path d="M${width - 260} 24h170M${width - 210} 33h170M${width - 230} ${height - 20}h190" stroke="${colors.accent}" stroke-opacity=".1"/><circle cx="${width - 64}" cy="${height / 2}" r="95" stroke="${colors.accent}" stroke-opacity=".09"/>`
      : profile.style === "anime"
        ? `<path d="M${width - 180} 56l5 12 12 5-12 5-5 12-5-12-12-5 12-5zM${width - 90} ${height - 80}l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="${colors.second}" fill-opacity=".23"/><circle cx="${width - 124}" cy="105" r="2" fill="${colors.accent}"/>`
        : profile.style === "futuristic"
          ? `<circle cx="${width - 105}" cy="${height / 2}" r="116" stroke="${colors.accent}" stroke-opacity=".1"/><circle cx="${width - 105}" cy="${height / 2}" r="92" stroke="${colors.second}" stroke-opacity=".09"/><path d="M${width - 180} 0v${height}M${width - 30} 0v${height}" stroke="#fff" stroke-opacity=".025"/>`
          : profile.style === "gaming"
            ? `<path d="M${width - 260} 0v${height}M${width - 220} 0v${height}M${width - 180} 0v${height}M${width - 140} 0v${height}M${width - 100} 0v${height}M${width - 60} 0v${height}M${width - 260} 60h250M${width - 260} 100h250M${width - 260} 140h250M${width - 260} 180h250M${width - 260} 220h250" stroke="${colors.accent}" stroke-opacity=".045"/>`
            : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111820"/><stop offset=".55" stop-color="#151c27"/><stop offset="1" stop-color="#10151e"/></linearGradient><linearGradient id="accent"><stop stop-color="${colors.accent}"/><stop offset="1" stop-color="${colors.second}"/></linearGradient><radialGradient id="glow"><stop stop-color="${colors.glow}" stop-opacity=".24"/><stop offset="1" stop-color="${colors.glow}" stop-opacity="0"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="28"/></filter><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity=".28"/></filter></defs><rect width="${width}" height="${height}" rx="30" fill="url(#bg)"/><circle cx="${width - 70}" cy="22" r="200" fill="url(#glow)" filter="url(#blur)"/>${motif}<path d="M0 ${height - 1}H${width}" stroke="url(#accent)" stroke-opacity=".42"/>${content}</svg>`;
}

function text(value: string, x: number, y: number, size: number, color = "#f3f5f7", weight = 400, extra = "") {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="${size}" font-weight="${weight}" ${extra}>${escapeXml(value)}</text>`;
}

function svgParagraph(value: string, x: number, y: number, width: number, height: number, color: string) {
  const size = 14;
  const limit = Math.max(16, Math.floor(width / (size * 0.55)));
  const maxLines = Math.max(1, Math.floor(height / (size * 1.65)));
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > limit && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    const last = lines.length - 1;
    lines[last] = `${lines[last].slice(0, Math.max(1, limit - 3)).trimEnd()}...`;
  }
  return `<text x="${x}" y="${y + size}" fill="${color}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="${size}" font-weight="400">${lines.map((lineText, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : size * 1.6}">${escapeXml(lineText)}</tspan>`).join("")}</text>`;
}

export function generateAssets(profile: Profile) {
  const colors = themeColors(profile);
  const name = escapeXml(profile.name);
  const headline = escapeXml(profile.headline);
  const bio = escapeXml(profile.bio || "I build thoughtful digital experiences and share what I learn along the way.");
  const safePhoto = photoDataUri(profile.photo);
  const avatar = safePhoto
    ? `<clipPath id="avatar"><circle cx="1010" cy="168" r="86"/></clipPath><circle cx="1010" cy="168" r="96" fill="url(#accent)" fill-opacity=".16"/><image href="${safePhoto}" x="924" y="82" width="172" height="172" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar)"/>`
    : `<circle cx="1010" cy="168" r="86" fill="url(#accent)" fill-opacity=".18"/>${text(profile.name.slice(0, 1).toUpperCase(), 977, 194, 80, colors.accent, 600)}`;
  const hero = panel(profile, 1200, 340,
    `<circle cx="0" cy="330" r="260" fill="url(#glow)"/><rect x="54" y="48" width="116" height="28" rx="14" fill="#ffffff" fill-opacity=".055" stroke="#ffffff" stroke-opacity=".08"/><circle cx="72" cy="62" r="4" fill="${colors.accent}"/>${text(profile.aesthetic === "creative" ? "DESIGNING WITH INTENTION" : "BUILDING IN PUBLIC", 84, 66, 10, "#bdc7d3", 600, 'letter-spacing="1.2"')}${text(`Hi, I'm ${profile.name.split(" ")[0]}.`, 54, 154, 52, "#f6f7f8", 700)}${text(headline, 56, 195, 19, colors.accent, 500)}<foreignObject x="56" y="220" width="740" height="56"><div xmlns="http://www.w3.org/1999/xhtml" style="font:14px/1.7 Inter,Segoe UI,sans-serif;color:#abb5c1">${bio}</div></foreignObject>${avatar}<circle cx="1082" cy="227" r="9" fill="#121921" stroke="#10151e" stroke-width="3"/><circle cx="1082" cy="227" r="4" fill="#78d7a2"/><path d="M898 284h224" stroke="#fff" stroke-opacity=".09"/>`);
  const about = panel(profile, 1200, 320,
    `<path d="M600 36v248" stroke="#fff" stroke-opacity=".09"/><circle cx="72" cy="67" r="5" fill="${colors.accent}"/>${text("WHAT I BUILD", 90, 73, 12, colors.accent, 700, 'letter-spacing="1.8"')}${text("Useful things, made", 56, 126, 27, "#f4f6f8", 650)}${text("with care and curiosity.", 56, 161, 27, "#f4f6f8", 650)}<foreignObject x="56" y="188" width="480" height="76"><div xmlns="http://www.w3.org/1999/xhtml" style="font:14px/1.7 Inter,Segoe UI,sans-serif;color:#aeb8c4">${bio}</div></foreignObject><circle cx="666" cy="67" r="5" fill="${colors.second}"/>${text("LIFE BEYOND CODE", 684, 73, 12, colors.second, 700, 'letter-spacing="1.8"')}${text(profile.location || "A curious mind,", 650, 126, 25, "#f4f6f8", 600)}${text("always exploring new ideas.", 650, 161, 25, "#f4f6f8", 600)}${text(profile.persona === "female" ? "Thoughtful details. Big ideas. A little wonder." : "Open skies. Side projects. Good conversations.", 650, 212, 13, "#aeb8c4")}<rect x="650" y="240" width="230" height="30" rx="15" fill="#ffffff" fill-opacity=".045"/>${text(profile.location ? `BASED IN ${profile.location.toUpperCase()}` : "CURIOUS BY DEFAULT", 667, 259, 10, "#b8c2ce", 600, 'letter-spacing="1.1"')}`);
  const skillChips = profile.skills.slice(0, 10).map((skill, index) => {
    const x = 54 + (index % 5) * 218;
    const y = 124 + Math.floor(index / 5) * 74;
    return `<rect x="${x}" y="${y}" width="194" height="50" rx="14" fill="#ffffff" fill-opacity=".035" stroke="#ffffff" stroke-opacity=".08"/><circle cx="${x + 20}" cy="${y + 25}" r="4" fill="${index % 2 ? colors.second : colors.accent}"/>${text(skill, x + 34, y + 30, 14, "#e5e9ee", 550)}${text(String(index + 1).padStart(2, "0"), x + 162, y + 30, 10, "#657181", 500)}`;
  }).join("");
  const stack = panel(profile, 1200, 300,
    `${text("THE TOOLKIT", 54, 70, 12, colors.accent, 700, 'letter-spacing="1.8"')}${text("Built with the right tools.", 54, 101, 21, "#eff2f5", 650)}${skillChips}`);
  const location = escapeXml(profile.location || "Available worldwide");
  const dashboard = panel(profile, 1200, 336,
    `<rect x="42" y="42" width="500" height="252" rx="22" fill="#ffffff" fill-opacity=".035" stroke="#fff" stroke-opacity=".085" filter="url(#shadow)"/><circle cx="76" cy="83" r="19" fill="url(#accent)" fill-opacity=".2"/>${text(profile.name.slice(0, 1).toUpperCase(), 68, 90, 20, colors.accent, 650)}${text("DEVELOPER ID", 108, 78, 10, "#8290a0", 700, 'letter-spacing="1.6"')}${text(name, 108, 104, 20, "#f4f6f8", 650)}${text(headline, 65, 145, 13, colors.accent, 500)}<path d="M65 168h452" stroke="#fff" stroke-opacity=".08"/>${text("BASED IN", 65, 198, 9, "#778494", 700, 'letter-spacing="1.2"')}${text(location, 65, 222, 13, "#d7dce3", 500)}${text("CURRENTLY", 290, 198, 9, "#778494", 700, 'letter-spacing="1.2"')}${text("Open to good ideas", 290, 222, 13, "#d7dce3", 500)}${text("PROFILE SIGNAL", 598, 73, 10, "#8290a0", 700, 'letter-spacing="1.5"')}${text("A little progress, every day.", 598, 101, 19, "#f2f4f6", 600)}<rect x="598" y="124" width="548" height="132" rx="18" fill="#ffffff" fill-opacity=".025" stroke="#fff" stroke-opacity=".07"/><path d="M624 226h488M624 193h488M624 160h488" stroke="#fff" stroke-opacity=".07"/><path d="M630 212c54-14 59-20 99-4s54-53 97-34 61-34 100-13 55-20 93-14 51-24 89-31" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/><circle cx="1108" cy="116" r="4" fill="${colors.accent}"/>${text("Learning  ·  Building  ·  Sharing", 598, 282, 11, "#9ca8b5", 500)}`);
  const contributionCells = Array.from({ length: 53 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const count = profile.githubStats.contributionWeeks[weekIndex]?.[dayIndex] ?? 0;
      const fill = count === 0 ? "#27313a" : count < 4 ? colors.accent : count < 9 ? colors.second : colors.glow;
      const opacity = count === 0 ? ".55" : count < 4 ? ".5" : count < 9 ? ".75" : ".95";
      return `<rect x="${624 + weekIndex * 9}" y="${143 + dayIndex * 13}" width="7" height="7" rx="2" fill="${fill}" fill-opacity="${opacity}"><title>${count} contributions</title></rect>`;
    }).join(""),
  ).join("");
  const dashboardWithContributions = dashboard
    .replace("A little progress, every day.", profile.githubStats.contributions === null
      ? "Contribution data unavailable"
      : `${profile.githubStats.contributions} contributions in ${profile.githubStats.contributionYear}`)
    .replace('<path d="M624 226h488M624 193h488M624 160h488" stroke="#fff" stroke-opacity=".07"/>', "")
    .replace('<path d="M630 212c54-14 59-20 99-4s54-53 97-34 61-34 100-13 55-20 93-14 51-24 89-31" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/>', contributionCells)
    .replace(/<circle cx="1108" cy="116" r="4" fill="[^"]+"\/>/, "");
  const connectLinks = [profile.github, profile.linkedin, profile.website, profile.twitter, profile.instagram].filter(Boolean).length;
  const connect = panel(profile, 1200, 250,
    `${text("LET'S MAKE SOMETHING MEANINGFUL", 54, 82, 11, colors.accent, 700, 'letter-spacing="1.6"')}${text("The next great idea", 54, 131, 34, "#f5f7f8", 700)}${text("could start with a hello.", 54, 171, 34, "#f5f7f8", 700)}<rect x="850" y="89" width="286" height="68" rx="18" fill="url(#accent)" fill-opacity=".12" stroke="url(#accent)" stroke-opacity=".45"/>${text("FIND ME AROUND THE WEB", 876, 117, 9, "#aeb8c4", 700, 'letter-spacing="1.2"')}${text(`${connectLinks} ways to connect`, 876, 141, 16, colors.accent, 600)}${text(profile.email || `@${profile.username}`, 56, 213, 13, "#aeb8c4", 500)}${text("MADE WITH CURIOSITY  /  UPDATED WITH INTENTION", 784, 213, 9, "#6f7c8c", 600, 'letter-spacing="1.1"')}`);

  const projectRows = profile.projects.length
    ? profile.projects.map((project) => `| [${markdownText(project.name)}](${markdownUrl(project.url) || `https://github.com/${profile.username}`}) | ${markdownText(project.description || "Public repository")}${markdownUrl(project.demo) ? ` · [Live demo](${markdownUrl(project.demo)})` : ""} | ${markdownText(project.stack || "See repository")} | ${project.stars} |`).join("\n")
    : `| **Selected work** | Browse my public repositories for current projects. | ${profile.skills.slice(0, 3).map(markdownText).join(" · ") || "Open source"} | 0 |`;
  const socials = [
    ["GitHub", profile.github || `https://github.com/${profile.username}`], ["LinkedIn", profile.linkedin], ["Website", profile.website], ["Instagram", profile.instagram], ["X", profile.twitter],
  ].filter(([, url]) => url && markdownUrl(url)).map(([label, url]) => `[${label}](${markdownUrl(url)})`).join(" &nbsp; · &nbsp; ");
  const oldContent = profile.originalReadme.trim().replace(/^\s*# .*\n?/m, "").slice(0, 5000);
  const readme = `<div align="center">\n\n<img src="./hero.svg" alt="${escapeXml(`${profile.name} — ${profile.headline}`)}" width="100%" />\n\n<img src="./about-life.svg" alt="What I build and life beyond code" width="100%" />\n\n<img src="./stack.svg" alt="Technology stack" width="100%" />\n\n<img src="./id-dashboard.svg" alt="Developer ID and dashboard" width="100%" />\n\n</div>\n\n## ✦ What I build\n\n${markdownText(profile.bio || `I'm ${profile.name}, a ${profile.headline.toLowerCase()} focused on making useful things with care.`)}\n\n## ✧ Featured builds\n\n| Project | What it is | Stack |\n|:---|:---|:---|\n${projectRows}\n\n## ◈ Contribution city\n\nA small map of the work, ideas, and consistency that make the journey. Generated daily by [GitHub Profile 3D Contrib](https://github.com/yoshi389111/github-profile-3d-contrib).\n\n![Contribution city](./profile-3d-contrib/profile-green-animate.svg)\n\n## ⌘ Technologies\n\n${profile.skills.map((skill) => `\`${markdownText(skill)}\``).join(" &nbsp; ")}\n\n## ✉ Connect\n\n${socials || `[GitHub](https://github.com/${profile.username})`}\n\n![Profile views](https://komarev.com/ghpvc/?username=${encodeURIComponent(profile.username)}&color=${colors.accent.slice(1)}&style=flat-square&label=PROFILE+VISITS)\n\n---\n\n<div align="center">\n\n**Thanks for stopping by. Stay curious, keep building.**\n\n<img src="./connect.svg" alt="Let's connect" width="100%" />\n\n</div>\n${oldContent ? `\n## More from my README\n\n${oldContent}\n` : ""}`;

  const readmeWithStats = readme
    .replace("| Project | What it is | Stack |", "| Project | What it is | Stack | Stars |")
    .replace("|:---|:---|:---|", "|:---|:---|:---|---:|")
    .replace("## ◈ Contribution city", `## ◈ Developer dashboard\n\n| Contributions (${profile.githubStats.contributionYear}) | Followers | Public repositories | Stars across repositories |\n|:---:|:---:|:---:|:---:|\n| ${profile.githubStats.contributions ?? "Unavailable"} | ${profile.githubStats.followers} | ${profile.githubStats.publicRepos} | ${profile.githubStats.stars} |\n\n## ◈ Contribution city`);

  return {
    readme: readmeWithStats,
    assets: {
      "hero.svg": hero,
      "about-life.svg": about,
      "stack.svg": stack,
      "id-dashboard.svg": dashboardWithContributions,
      "connect.svg": connect,
      ".github/workflows/profile-3d.yml": workflow,
    },
  };
}

const workflow = `name: Profile contribution city\n\non:\n  schedule:\n    - cron: "17 0 * * *"\n  workflow_dispatch:\n\npermissions:\n  contents: write\n\njobs:\n  generate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: yoshi389111/github-profile-3d-contrib@latest\n        env:\n          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}\n          USERNAME: \${{ github.repository_owner }}\n      - uses: stefanzweifel/git-auto-commit-action@v5\n        with:\n          commit_message: "chore: refresh contribution city"\n`;