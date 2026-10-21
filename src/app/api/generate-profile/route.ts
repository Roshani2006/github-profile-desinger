import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { profileSchema } from "@/lib/profile";
import { generateAssets } from "@/lib/profile-assets";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.githubAccessToken) return NextResponse.json({ error: "Sign in with GitHub before publishing." }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Some profile details are invalid. Check the form and try again." }, { status: 400 });

  try {
    const octokit = new Octokit({ auth: token.githubAccessToken });
    const { data: user } = await octokit.users.getAuthenticated();
    const profile = { ...parsed.data, username: user.login, github: `https://github.com/${user.login}` };
    let repository;
    try {
      ({ data: repository } = await octokit.repos.get({ owner: user.login, repo: profile.repository }));
    } catch (error) {
      if (!(error instanceof Error && "status" in error && error.status === 404)) throw error;
      ({ data: repository } = await octokit.repos.createForAuthenticatedUser({
        name: profile.repository,
        description: `A personal profile by ${profile.name}, generated with Profile Atelier.`,
        private: false,
        auto_init: true,
      }));
    }

    if (repository.owner.login.toLowerCase() !== user.login.toLowerCase()) {
      return NextResponse.json({ error: "Choose a repository owned by your signed-in GitHub account." }, { status: 403 });
    }
    if (repository.private) {
      return NextResponse.json({ error: "Your profile repository must be public for the README and SVGs to be visible." }, { status: 400 });
    }

    const branch = repository.default_branch || "main";
    const { readme, assets } = generateAssets(profile);
    const files = { "README.md": readme, ...assets };
    for (const [path, content] of Object.entries(files)) {
      let sha: string | undefined;
      try {
        const existing = await octokit.repos.getContent({ owner: user.login, repo: profile.repository, path, ref: branch });
        if (!Array.isArray(existing.data) && "sha" in existing.data) sha = existing.data.sha;
      } catch (error) {
        if (!(error instanceof Error && "status" in error && error.status === 404)) throw error;
      }
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: profile.repository,
        path,
        message: `chore: update profile ${path}`,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      });
    }

    return NextResponse.json({
      repository: `https://github.com/${user.login}/${profile.repository}`,
      branch,
      files: Object.keys(files),
    });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const message = status === 403
      ? "GitHub denied access. Confirm the OAuth app has read:user and repo access, then reconnect."
      : status === 404
        ? "That repository could not be found. Choose a repository owned by your account."
        : "GitHub could not publish your profile right now. Try again in a moment.";
    return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}