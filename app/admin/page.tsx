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
  createUser,
  resetUserPassword,
  setUserActive,
  deleteUser,
} from "@/lib/api/admin";
import {
  getAdminTags,
  createTag,
  updateTag,
  setTagStatus,
  deleteTag,
} from "@/lib/api/tags";
import { useAuth } from "@/lib/auth";
import {
  ROLE_LABEL,
  AFFILIATION_TYPE_LABEL,
  affiliationOf,
  type AdminUser,
  type Affiliation,
  type Photo,
  type Role,
  type Tag,
} from "@/lib/types";
import { DAYS, DAY_LABEL, type Day } from "@/lib/event";
import { IconEye, IconEyeOff, IconEdit, IconTrash } from "@/components/icons";

type Vis = "ALL" | "VISIBLE" | "HIDDEN";
const ROLES: Role[] = ["ADMIN", "LEADER", "VIEWER"];

function reportError(e: unknown) {
  alert(e instanceof Error ? e.message : "작업에 실패했어요.");
}

export default function AdminPage() {
  const { role, session } = useAuth();
  const router = useRouter();
  const isAdmin = role === "ADMIN";
  const token = session?.token ?? null;

  const [images, setImages] = useState<Photo[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 게시물 필터
  const [fAffil, setFAffil] = useState<string>("");
  const [fDay, setFDay] = useState<Day | "">("");
  const [fVis, setFVis] = useState<Vis>("ALL");
  const [fTag, setFTag] = useState<string>("");

  // 새 계정 / 새 태그 입력
  const [newUser, setNewUser] = useState<{
    username: string;
    password: string;
    displayName: string;
    role: Role;
    affiliationKey: string;
  } | null>(null);
  const [newTag, setNewTag] = useState<{ tagKey: string; tagName: string } | null>(null);

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
      getAdminTags(token),
    ])
      .then(([imgs, us, affs, tgs]) => {
        setImages(imgs);
        setUsers(us);
        setAffiliations(affs);
        setTags(tgs);
      })
      .finally(() => setLoading(false));
  }, [isAdmin, token]);

  const filteredImages = useMemo(
    () =>
      images.filter(
        (p) =>
          (!fAffil || affiliationOf(p) === fAffil) &&
          (!fDay || p.day === fDay) &&
          (!fTag || p.tagKey === fTag) &&
          (fVis === "ALL" || (fVis === "HIDDEN" ? p.hidden : !p.hidden)),
      ),
    [images, fAffil, fDay, fTag, fVis],
  );

  const hiddenCount = useMemo(() => images.filter((p) => p.hidden).length, [images]);

  async function toggleHidden(p: Photo) {
    try {
      const updated = await setImageHidden(p.id, !p.hidden, token);
      setImages((prev) => prev.map((x) => (x.id === p.id ? { ...x, hidden: updated.hidden } : x)));
    } catch (e) {
      reportError(e);
    }
  }

  async function patchUser(
    id: string,
    patch: { role?: Role; affiliationKey?: string | null; displayName?: string },
  ) {
    try {
      const updated = await updateUser(id, patch, token);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e) {
      reportError(e);
    }
  }

  async function toggleUserActive(u: AdminUser) {
    try {
      const updated = await setUserActive(u.id, !(u.active ?? true), token);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      reportError(e);
    }
  }

  async function resetPw(u: AdminUser) {
    const pw = prompt(`${u.username} 의 새 비밀번호를 입력하세요.`);
    if (!pw) return;
    try {
      await resetUserPassword(u.id, pw, token);
      alert("비밀번호를 재설정했어요.");
    } catch (e) {
      reportError(e);
    }
  }

  async function removeUser(u: AdminUser) {
    if (!confirm(`${u.username} 계정을 삭제할까요? (게시물이 있으면 삭제되지 않아요)`)) return;
    try {
      await deleteUser(u.id, token);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      reportError(e);
    }
  }

  async function submitNewUser() {
    if (!newUser || !newUser.username || !newUser.password || !newUser.displayName) {
      alert("아이디·비밀번호·표시명을 입력하세요.");
      return;
    }
    try {
      const created = await createUser(
        {
          username: newUser.username,
          password: newUser.password,
          displayName: newUser.displayName,
          role: newUser.role,
          affiliationKey: newUser.affiliationKey || null,
        },
        token,
      );
      setUsers((prev) => [...prev, created]);
      setNewUser(null);
    } catch (e) {
      reportError(e);
    }
  }

  async function renameTag(t: Tag, name: string) {
    if (!name.trim() || name === t.tagName) return;
    try {
      const updated = await updateTag(t.id, name.trim(), token);
      setTags((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
    } catch (e) {
      reportError(e);
    }
  }

  async function toggleTagActive(t: Tag) {
    try {
      const updated = await setTagStatus(t.id, !t.active, token);
      setTags((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
    } catch (e) {
      reportError(e);
    }
  }

  async function removeTag(t: Tag) {
    if (!confirm(`'${t.tagName}' 태그를 삭제할까요? (사용 중이면 삭제되지 않아요)`)) return;
    try {
      await deleteTag(t.id, token);
      setTags((prev) => prev.filter((x) => x.id !== t.id));
    } catch (e) {
      reportError(e);
    }
  }

  async function submitNewTag() {
    if (!newTag || !newTag.tagKey || !newTag.tagName) {
      alert("태그 키·이름을 입력하세요.");
      return;
    }
    try {
      const created = await createTag({ tagKey: newTag.tagKey, tagName: newTag.tagName }, token);
      setTags((prev) => [...prev, created]);
      setNewTag(null);
    } catch (e) {
      reportError(e);
    }
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
            게시물 운영 · 사용자 관리 · 태그 · 소속 조회
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
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="전체 게시물" value={images.length} hint="숨김 포함" />
        <Stat label="숨김 게시물" value={hiddenCount} hint="복구 가능" />
        <Stat label="운영 계정" value={users.length} hint="ADMIN / LEADER" />
        <Stat label="태그" value={tags.length} hint="활성/비활성" />
        <Stat label="Affiliation" value={affiliations.length} hint="소속 기준" />
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
      ) : (
        <>
          {/* ── 게시물 관리 ── */}
          <Section title="게시물 관리" desc="GET /admin/images 기반. 수정 · 숨김 · 복구를 한곳에서.">
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
                options={[{ v: "", t: "전체 day" }, ...DAYS.map((d) => ({ v: d, t: DAY_LABEL[d] }))]}
              />
              <Select
                label="태그"
                value={fTag}
                onChange={setFTag}
                options={[
                  { v: "", t: "전체 태그" },
                  ...tags.map((t) => ({ v: t.tagKey, t: t.tagName })),
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
              <table className="w-full min-w-[820px] border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[var(--bg-soft)] text-left text-[11.5px] uppercase tracking-wide text-[var(--muted)]">
                    <Th>썸네일</Th>
                    <Th>코멘트</Th>
                    <Th>소속</Th>
                    <Th>day</Th>
                    <Th>태그</Th>
                    <Th>업로더</Th>
                    <Th>상태</Th>
                    <Th>액션</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImages.map((p) => (
                    <tr key={p.id} className="border-t border-[var(--line)] align-middle">
                      <td className="p-2.5">
                        <SmartImg
                          src={imageSrc(p.thumbnailUrl ?? p.imageUrl)}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      </td>
                      <td className="max-w-[200px] truncate p-2.5">{p.comment || "—"}</td>
                      <td className="p-2.5 font-semibold">{affiliationOf(p)}</td>
                      <td className="p-2.5">{p.day ? DAY_LABEL[p.day] : "—"}</td>
                      <td className="p-2.5 text-[var(--muted)]">{p.tagName ?? "—"}</td>
                      <td className="p-2.5 text-[var(--muted)]">{p.uploadedBy ?? "—"}</td>
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
            desc="GET/POST/PATCH/DELETE /admin/users — 생성 · role/소속/표시명 · 비밀번호 · 활성 · 삭제."
          >
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() =>
                  setNewUser(
                    newUser
                      ? null
                      : { username: "", password: "", displayName: "", role: "LEADER", affiliationKey: "" },
                  )
                }
                className="tappable rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[13px] font-bold text-white"
              >
                {newUser ? "취소" : "+ 새 계정"}
              </button>
            </div>

            {newUser && (
              <div className="mb-3 grid gap-2 rounded-xl border border-[var(--accent)] bg-[rgba(47,111,237,0.04)] p-3.5 sm:grid-cols-5">
                <input
                  placeholder="아이디"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="field rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none"
                />
                <input
                  placeholder="비밀번호"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="field rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none"
                />
                <input
                  placeholder="표시명"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="field rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                  className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={newUser.affiliationKey}
                    onChange={(e) => setNewUser({ ...newUser, affiliationKey: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px]"
                  >
                    <option value="">소속 없음</option>
                    {affiliations.map((a) => (
                      <option key={a.affiliationKey} value={a.affiliationKey}>
                        {a.affiliationName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={submitNewUser}
                    className="tappable rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[13px] font-bold text-white"
                  >
                    생성
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-2.5 sm:grid-cols-2">
              {users.map((u) => {
                const active = u.active ?? true;
                return (
                  <div
                    key={u.id}
                    className={`rounded-xl border p-3.5 ${
                      active
                        ? "border-[var(--line)] bg-[var(--bg-soft)]"
                        : "border-[rgba(200,50,40,0.3)] bg-[rgba(200,50,40,0.04)]"
                    }`}
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="font-bold">
                        {u.username}
                        {!active && (
                          <span className="ml-2 rounded-full bg-[rgba(200,50,40,0.12)] px-2 py-0.5 text-[10.5px] font-bold text-[#c0392b]">
                            비활성
                          </span>
                        )}
                      </span>
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
                          value={u.affiliationKey ?? ""}
                          onChange={(e) => patchUser(u.id, { affiliationKey: e.target.value || null })}
                          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5"
                        >
                          <option value="">없음</option>
                          {affiliations.map((a) => (
                            <option key={a.affiliationKey} value={a.affiliationKey}>
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
                    <div className="mt-2.5 flex gap-1.5">
                      <button
                        onClick={() => toggleUserActive(u)}
                        className="tappable rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12px] font-semibold hover:bg-[var(--bg)]"
                      >
                        {active ? "비활성화" : "활성화"}
                      </button>
                      <button
                        onClick={() => resetPw(u)}
                        className="tappable rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12px] font-semibold hover:bg-[var(--bg)]"
                      >
                        비번 재설정
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        className="tappable ml-auto flex items-center gap-1 rounded-lg border border-[rgba(200,50,40,0.3)] px-2.5 py-1.5 text-[12px] font-semibold text-[#c0392b] hover:bg-[rgba(200,50,40,0.06)]"
                      >
                        <IconTrash className="h-[13px] w-[13px]" /> 삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── 태그 관리 ── */}
          <Section
            title="태그 관리"
            desc="GET/POST/PATCH/DELETE /admin/tags — 프로그램 태그 생성 · 이름 · 활성 · 삭제."
          >
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setNewTag(newTag ? null : { tagKey: "", tagName: "" })}
                className="tappable rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[13px] font-bold text-white"
              >
                {newTag ? "취소" : "+ 새 태그"}
              </button>
              {newTag && (
                <>
                  <input
                    placeholder="키 (영문, 예: meal)"
                    value={newTag.tagKey}
                    onChange={(e) => setNewTag({ ...newTag, tagKey: e.target.value })}
                    className="field rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none"
                  />
                  <input
                    placeholder="이름 (예: 식사)"
                    value={newTag.tagName}
                    onChange={(e) => setNewTag({ ...newTag, tagName: e.target.value })}
                    className="field rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none"
                  />
                  <button
                    onClick={submitNewTag}
                    className="tappable rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[13px] font-bold text-white"
                  >
                    생성
                  </button>
                </>
              )}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl border p-3.5 ${
                    t.active
                      ? "border-[var(--line)] bg-[var(--bg-soft)]"
                      : "border-[var(--line)] bg-[var(--bg-soft)] opacity-60"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                      {t.tagKey}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">사진 {t.imageCount ?? 0}장</span>
                  </div>
                  <input
                    defaultValue={t.tagName}
                    onBlur={(e) => renameTag(t, e.target.value)}
                    className="field mb-2 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-[13px] font-semibold outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleTagActive(t)}
                      className="tappable rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12px] font-semibold hover:bg-[var(--bg)]"
                    >
                      {t.active ? "비활성" : "활성"}
                    </button>
                    <button
                      onClick={() => removeTag(t)}
                      className="tappable ml-auto flex items-center gap-1 rounded-lg border border-[rgba(200,50,40,0.3)] px-2.5 py-1.5 text-[12px] font-semibold text-[#c0392b] hover:bg-[rgba(200,50,40,0.06)]"
                    >
                      <IconTrash className="h-[13px] w-[13px]" /> 삭제
                    </button>
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
                  <p className="mt-1.5 text-[12px] text-[var(--muted)]">key: {a.affiliationKey}</p>
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
