export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const hasJson = response.headers.get("content-type")?.includes("application/json");
  const body = hasJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(body?.error || "Não foi possível concluir a solicitação.", {
      status: response.status,
      code: body?.code,
    });
  }

  return body;
}
