import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.githubAccessToken) return NextResponse.json({ error: "Sign in to connect a repository." }, { status: 401 });

  try {
    const octokit = new Octokit({ auth: token.githubAccessToken });
    const { data: user } = await octokit.users.getAuthenticated();
    const allRepositories = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
      visibility: "all",
      affiliation: "owner",
      per_page: 100,
      sort: "updated",
    });
    const publicRepositories = allRepositories.filter((repo) => !repo.private && repo.owner.login.toLowerCase() === user.login.toLowerCase());
    const profileRepository = publicRepositories.find((repo) => repo.name.toLowerCase() === user.login.toLowerCase());
    const candidates = publicRepositories
      .filter((repo) => !repo.fork && repo.name.toLowerCase() !== user.login.toLowerCase())
      .sort((left, right) => right.stargazers_count - left.stargazers_count || (right.pushed_at ?? "").localeCompare(left.pushed_at ?? ""));
    const featuredRepositories = (candidates.length ? candidates : publicRepositories.filter((repo) => repo.name !== profileRepository?.name)).slice(0, 8);
    const languageResults = await Promise.all(featuredRepositories.map(async (repo) => {
      try {
        const { data } = await octokit.repos.listLanguages({ owner: user.login, repo: repo.name });
        return data;
      } catch {
        return {};
      }
    }));

    const languageTotals = new Map<string, number>();
    languageResults.forEach((languages) => Object.entries(languages).forEach(([language, bytes]) => {
      languageTotals.set(language, (languageTotals.get(language) ?? 0) + bytes);
    }));
    const year = new Date().getUTCFullYear();
    let contributions: number | null = null;
    let contributionWeeks: number[][] = [];
    try {
      const contributionData = await octokit.graphql<{
        user: { contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: { contributionDays: { contributionCount: number }[] }[] } } };
      }>(
        `query($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
                weeks { contributionDays { contributionCount } }
              }
            }
          }
        }`,
        { login: user.login, from: `${year}-01-01T00:00:00Z`, to: new Date().toISOString() },
      );
      contributions = contributionData.user.contributionsCollection.contributionCalendar.totalContributions;
      contributionWeeks = contributionData.user.contributionsCollection.contributionCalendar.weeks
        .map((week) => week.contributionDays.map((day) => day.contributionCount));
    } catch {
      // Contribution totals are optional; profile and repository data remain available if GraphQL is unavailable.
    }

    let avatar = "";
    try {
      const avatarUrl = new URL(user.avatar_url);
      if (avatarUrl.hostname === "avatars.githubusercontent.com") {
        avatarUrl.searchParams.set("s", "256");
        const response = await fetch(avatarUrl, { redirect: "error", signal: AbortSignal.timeout(5000) });
        const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
        if (response.ok && ["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
          const image = await response.arrayBuffer();
          if (image.byteLength <= 500_000) avatar = `data:${contentType};base64,${Buffer.from(image).toString("base64")}`;
        }
      }
    } catch {
      avatar = "";
    }

    const repositories = publicRepositories.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.pushed_at,
      isProfile: repo.name.toLowerCase() === user.login.toLowerCase(),
    }));
    const projects = featuredRepositories.slice(0, 6).map((repo, index) => ({
      name: repo.name,
      description: repo.description ?? "",
      stack: Object.entries(languageResults[index] ?? {}).sort((left, right) => right[1] - left[1]).slice(0, 4).map(([language]) => language).join(" · ") || repo.language || "",
      url: repo.html_url,
      demo: repo.homepage ?? "",
      stars: repo.stargazers_count,
    }));

    return NextResponse.json({
      user: {
        login: user.login,
        name: user.name,
        bio: user.bio,
        location: user.location,
        email: user.email,
        website: user.blog,
        company: user.company,
        twitter: user.twitter_username,
        avatar,
      },
      repositories,
      projects,
      stats: {
        followers: user.followers,
        following: user.following,
        publicRepos: publicRepositories.length,
        stars: publicRepositories.reduce((total, repo) => total + repo.stargazers_count, 0),
        forks: publicRepositories.reduce((total, repo) => total + repo.forks_count, 0),
        contributions,
        contributionYear: year,
        contributionWeeks,
        languages: Array.from(languageTotals.entries()).sort((left, right) => right[1] - left[1]).slice(0, 12).map(([language]) => language),
      },
    });
  } catch {
    return NextResponse.json({ error: "GitHub could not return your profile data. Reconnect your account and try again." }, { status: 502 });
  }
}