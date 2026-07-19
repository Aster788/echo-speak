const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";

export type FeishuCredentials = {
  appId: string;
  appSecret: string;
};

export type FeishuDocumentRef = {
  token: string;
  name: string;
  updatedAt: string;
};

type TenantTokenResponse = {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
};

type DriveFilesResponse = {
  code: number;
  msg: string;
  data?: {
    files?: Array<{
      token: string;
      name: string;
      type: string;
      modified_time?: string;
    }>;
    has_more?: boolean;
    next_page_token?: string;
  };
};

type RawContentResponse = {
  code: number;
  msg: string;
  data?: {
    content?: string;
  };
};

export class FeishuApiError extends Error {
  constructor(
    message: string,
    readonly code?: number
  ) {
    super(message);
    this.name = "FeishuApiError";
  }
}

export async function fetchTenantAccessToken(
  credentials: FeishuCredentials,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl(
    `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: credentials.appId,
        app_secret: credentials.appSecret,
      }),
    }
  );

  const data = (await response.json()) as TenantTokenResponse;
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new FeishuApiError(data.msg || "Failed to obtain Feishu tenant token", data.code);
  }
  return data.tenant_access_token;
}

export async function listAccessibleDocuments(
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<FeishuDocumentRef[]> {
  const docs: FeishuDocumentRef[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("page_size", "50");
    if (pageToken) params.set("page_token", pageToken);

    const response = await fetchImpl(
      `${FEISHU_API_BASE}/drive/v1/files?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = (await response.json()) as DriveFilesResponse;
    if (!response.ok || data.code !== 0) {
      throw new FeishuApiError(data.msg || "Failed to list Feishu documents", data.code);
    }

    for (const file of data.data?.files ?? []) {
      if (file.type === "docx" || file.type === "doc") {
        docs.push({
          token: file.token,
          name: file.name,
          updatedAt: file.modified_time ?? new Date().toISOString(),
        });
      }
    }

    pageToken = data.data?.has_more ? data.data.next_page_token : undefined;
  } while (pageToken);

  return docs;
}

/** Raw text export; Feishu returns plain/Markdown-like content suitable for parseFeishuDoc. */
export async function fetchDocumentRawContent(
  token: string,
  documentToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl(
    `${FEISHU_API_BASE}/docx/v1/documents/${documentToken}/raw_content`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = (await response.json()) as RawContentResponse;
  if (!response.ok || data.code !== 0) {
    throw new FeishuApiError(data.msg || "Failed to fetch document content", data.code);
  }
  const content = data.data?.content?.trim();
  if (!content) {
    throw new FeishuApiError("Document content is empty");
  }
  return content;
}
