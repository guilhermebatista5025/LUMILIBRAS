export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Inicie o projeto com npm run dev e tente novamente.",
      { status: 0, code: "API_UNAVAILABLE" },
    );
  }

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
