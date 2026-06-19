"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SmartImg } from "@/components/SmartImg";
import { imageSrc } from "@/lib/api/client";
import {
  getAdminImages,
  getAdminAffiliations,
  getAdminUsers,
  setImageHidden,
  updateUser,
} from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import {
  ROLE_LABEL,
  AFFILIATION_TYPE_LABEL,
  affiliationOf,
  type AdminUser,
  type Affiliation,
  type Photo,
  type Role,
} from "@/lib/types";
import { DAYS, DAY_LABEL, type Day } from "@/lib/event";
import { IconEye, IconEyeOff, IconEdit } from "@/components/icons";

type Vis = "ALL" | "VISIBLE" | "HIDDEN";
const ROLES: Role[] = ["ADMIN", "LEADER", "VIEWER"];

export default function AdminPage() {
  const { role, session } = useAuth();
  const router = useRouter();
  const isAdmin = role === "ADMIN";
  const token = session?.token ?? null;

  const [images, setImages] = useState<Photo[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);

  // 게시물 필터
  const [fAffil, setFAffil] = useState<string>("");
  const [fDay, setFDay] = useState<Day | "">("");
  const [fVis, setFVis] = useState<Vis>("ALL");

  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    Promise.all([
      getAdminImages(token),
      getAdminUsers(token),
      getAdminAffiliations(token),
    ])
      .then(([imgs, us, affs]) => {
        setImages(imgs);
        setUsers(us);
        setAffiliations(affs);
      })
      .finally(() => setLoading(false));
  }, [isAdmin, token]);

  const filteredImages = useMemo(
    () =>
      images.filter(
        (p) =>
          (!fAffil || affiliationOf(p) === fAffil) &&
          (!fDay || p.day === fDay) &&
          (fVis === "ALL" || (fVis === "HIDDEN" ? p.hidden : !p.hidden)),
      ),
    [images, fAffil, fDay, fVis],
  );

  const hiddenCount = useMemo(() => images.filter((p) => p.hidden).length, [images]);

  async function toggleHidden(p: Photo) {
    const next = !p.hidden;
    const updated = await setImageHidden(p.id, next, token);
    setImages((prev) => prev.map((x) => (x.id === p.id ? { ...x, hidden: updated.hidden } : x)));
  }

  async function patchUser(
    id: string,
    patch: { role?: Role; affiliationName?: string | null; displayName?: string },
  ) {
    const updated = await updateUser(id, patch, token);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto mt-24 max-w-[460px] px-[18px] text-center">
        <p className="text-[15px] font-semibold text-[var(--text)]">관리자 전용 화면이에요.</p>
        <Link
          href="/gallery"
          className="tappable mt-4 inline-block rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-5 py-2.5 text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--line)]"
        >
          갤러리로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-7">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">관리자 콘솔</h1>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">
            게시물 운영 · 사용자 관리 · 소속 조회
          </p>
        </div>
        <Link
          href="/gallery"
          className="tappable rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--line)]"
        >
          갤러리로
        </Link>
      </header>

      {/* 요약 카드 */}
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 게시물" value={images.length} hint="최신순 · 숨김 포함" />
        <Stat label="숨김 게시물" value={hiddenCount} hint="복구 가능 상태" />
        <Stat label="운영 계정" value={users.length} hint="ADMIN / LEADER 포함" />
        <Stat label="Affiliation" value={affiliations.length} hint="소속 기준 데이터" />
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
      ) : (
        <>
          {/* ── 게시물 관리 ── */}
          <Section
            title="게시물 관리"
            desc="GET /admin/images 기반. 수정 · 숨김 · 복구를 한곳에서."
          >
            <div className="mb-3 flex flex-wrap gap-2">
              <Select
                label="소속"
                value={fAffil}
                onChange={setFAffil}
                options={[
                  { v: "", t: "전체 소속" },
                  ...affiliations.map((a) => ({ v: a.affiliationName, t: a.affiliationName })),
                ]}
              />
              <Select
                label="day"
                value={fDay}
                onChange={(v) => setFDay(v as Day | "")}
                options={[
                  { v: "", t: "전체 day" },
                  ...DAYS.map((d) => ({ v: d, t: DAY_LABEL[d] })),
                ]}
              />
              <Select
                label="노출"
                value={fVis}
                onChange={(v) => setFVis(v as Vis)}
                options={[
                  { v: "ALL", t: "전체" },
                  { v: "VISIBLE", t: "노출 중" },
                  { v: "HIDDEN", t: "숨김" },
                ]}
              />
              <span className="ml-auto self-center text-[12.5px] text-[var(--muted)]">
                {filteredImages.length}건
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full min-w-[760px] border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[var(--bg-soft)] text-left text-[11.5px] uppercase tracking-wide text-[var(--muted)]">
                    <Th>썸네일</Th>
                    <Th>코멘트</Th>
                    <Th>소속</Th>
                    <Th>day</Th>
                    <Th>업로더</Th>
                    <Th>생성</Th>
                    <Th>상태</Th>
                    <Th>액션</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImages.map((p) => (
                    <tr key={p.id} className="border-t border-[var(--line)] align-middle">
                      <td className="p-2.5">
                        <SmartImg
                          src={imageSrc(p.imageUrl)}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      </td>
                      <td className="max-w-[220px] truncate p-2.5">{p.comment || "—"}</td>
                      <td className="p-2.5 font-semibold">{affiliationOf(p)}</td>
                      <td className="p-2.5">{p.day ? DAY_LABEL[p.day] : "—"}</td>
                      <td className="p-2.5 text-[var(--muted)]">{p.uploadedBy ?? "—"}</td>
                      <td className="whitespace-nowrap p-2.5 text-[var(--muted)]">
                        {p.createdAt.slice(0, 10)}
                      </td>
                      <td className="p-2.5">
                        {p.hidden ? (
                          <span className="rounded-full bg-[rgba(200,50,40,0.1)] px-2 py-0.5 text-[11.5px] font-bold text-[#c0392b]">
                            숨김
                          </span>
                        ) : (
                          <span className="rounded-full bg-[rgba(47,111,237,0.1)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--accent)]">
                            노출 중
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => router.push(`/edit/${p.id}`)}
                            className="tappable flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--text)] hover:bg-[var(--bg-soft)]"
                          >
                            <IconEdit className="h-[14px] w-[14px]" /> 수정
                          </button>
                          <button
                            onClick={() => toggleHidden(p)}
                            className="tappable flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--text)] hover:bg-[var(--bg-soft)]"
                          >
                            {p.hidden ? (
                              <>
                                <IconEye className="h-[14px] w-[14px]" /> 복구
                              </>
                            ) : (
                              <>
                                <IconEyeOff className="h-[14px] w-[14px]" /> 숨김
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredImages.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-[var(--muted)]">
                        조건에 맞는 게시물이 없어요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── 사용자 관리 ── */}
          <Section
            title="사용자 관리"
            desc="GET /admin/users · PATCH /admin/users/{id} — role · 소속 · 표시명 조정."
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3.5"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="font-bold">{u.username}</span>
                    <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--accent)]">
                      {ROLE_LABEL[u.role]}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="text-[12px]">
                      <span className="mb-1 block text-[var(--muted)]">role</span>
                      <select
                        value={u.role}
                        onChange={(e) => patchUser(u.id, { role: e.target.value as Role })}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[12px]">
                      <span className="mb-1 block text-[var(--muted)]">소속</span>
                      <select
                        value={u.affiliationName ?? ""}
                        onChange={(e) =>
                          patchUser(u.id, { affiliationName: e.target.value || null })
                        }
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5"
                      >
                        <option value="">없음</option>
                        {affiliations.map((a) => (
                          <option key={a.affiliationKey} value={a.affiliationName}>
                            {a.affiliationName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[12px]">
                      <span className="mb-1 block text-[var(--muted)]">표시명</span>
                      <input
                        defaultValue={u.displayName}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== u.displayName) patchUser(u.id, { displayName: v });
                        }}
                        className="field w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 outline-none"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Affiliation 조회 ── */}
          <Section
            title="Affiliation 조회"
            desc="GET /admin/affiliations — 사용자 수정 시 선택 가능한 소속 기준 데이터(조회 전용)."
          >
            <div className="grid gap-2.5 sm:grid-cols-3">
              {affiliations.map((a) => (
                <div
                  key={a.affiliationKey}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{a.affiliationName}</span>
                    <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                      {AFFILIATION_TYPE_LABEL[a.affiliationType]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-[var(--muted)]">
                    key: {a.affiliationKey}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4">
      <p className="text-[12px] font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">{hint}</p>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-[17px] font-bold">{title}</h2>
      <p className="mb-3 mt-0.5 text-[12.5px] text-[var(--muted)]">{desc}</p>
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap p-2.5 font-semibold">{children}</th>;
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; t: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-[12.5px]">
      <span className="text-[var(--muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-2.5 py-1.5 font-semibold"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}
