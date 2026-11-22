type OriginRequest = {
  headers: Pick<Headers, "get">;
  nextUrl: Pick<URL, "protocol" | "host">;
};

/** Validate the browser's Origin against the authority that received the request.
 * Next's internal nextUrl can use localhost for a request made to 127.0.0.1.
 * Host stays authoritative; forwarded headers never grant an origin exception.
 * Non-browser clients without Origin retain the existing authenticated API flow.
 */
export function isSameOriginRequest(request: OriginRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    const source = new URL(origin);
    const target = new URL(
      `${request.nextUrl.protocol}//${request.headers.get("host") ?? request.nextUrl.host}`,
    );
    if (
      source.username ||
      source.password ||
      source.pathname !== "/" ||
      source.search ||
      source.hash
    )
      return false;
    if (
      target.username ||
      target.password ||
      target.pathname !== "/" ||
      target.search ||
      target.hash
    )
      return false;
    return source.origin === target.origin;
  } catch {
    return false;
  }
}
