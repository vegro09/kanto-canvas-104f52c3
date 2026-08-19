import { useState, useEffect, useRef } from "react";
import { X, Plus, Check, Link as LinkIcon, FolderTree, Lightbulb, Mic, MicOff, Globe, AlignRight, AlignLeft } from "lucide-react";
import type { GraphNode, ManualNodePayload } from "@/lib/graph-data";
import { createDictationSession, isDictationSupported, type DictationLanguage, type DictationSession } from "@/lib/dictation";

interface NodeForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNodes: GraphNode[];
  selectedParentId?: string | null;
  initialKind?: "category" | "idea";
  editingNode?: GraphNode | null;
  onSubmit: (payload: ManualNodePayload) => void;
  onSubmitEdit?: (nodeId: string, payload: ManualNodePayload) => void;
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

export default function NodeForgeModal({
  isOpen,
  onClose,
  existingNodes,
  selectedParentId,
  initialKind = "idea",
  editingNode = null,
  onSubmit,
  onSubmitEdit,
}: NodeForgeModalProps) {
  const isEditing = Boolean(editingNode);

  const [kind, setKind] = useState<"category" | "idea">(initialKind);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [parentId, setParentId] = useState("core");

  // Dictation and Direction state
  const [dictationLang, setDictationLang] = useState<DictationLanguage>("ar-SA");
  const [isRtlManual, setIsRtlManual] = useState<boolean | null>(null);
  const [activeDictationField, setActiveDictationField] = useState<"title" | "description" | null>(null);
  const dictationSessionRef = useRef<DictationSession | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingNode) {
        setKind(editingNode.kind === "core" ? "category" : (editingNode.kind as "category" | "idea"));
        setTitle(editingNode.title);
        setDescription(editingNode.body || "");
        setUrl(editingNode.url || "");
        setParentId(editingNode.parentId || "core");
      } else {
        setKind(initialKind);
        if (selectedParentId && existingNodes.some((n) => n.id === selectedParentId)) {
          setParentId(selectedParentId);
        } else {
          const firstCategory = existingNodes.find((n) => n.kind === "category");
          setParentId(initialKind === "category" || !firstCategory ? "core" : firstCategory.id);
        }
        setTitle("");
        setDescription("");
        setUrl("");
      }
      setActiveDictationField(null);
      setIsRtlManual(null);
    } else {
      if (dictationSessionRef.current) {
        dictationSessionRef.current.stop();
      }
    }
  }, [isOpen, initialKind, selectedParentId, editingNode, existingNodes]);

  // Clean up dictation on unmount
  useEffect(() => {
    return () => {
      if (dictationSessionRef.current) {
        dictationSessionRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleDictation = (field: "title" | "description") => {
    if (!isDictationSupported()) {
      alert("Dictation is not supported in this browser. You can type manually.");
      return;
    }

    if (activeDictationField === field) {
      if (dictationSessionRef.current) {
        dictationSessionRef.current.stop();
      }
      setActiveDictationField(null);
    } else {
      if (dictationSessionRef.current) {
        dictationSessionRef.current.stop();
      }

      let baseText = field === "title" ? title : description;

      const session = createDictationSession(
        dictationLang,
        (interimText) => {
          const updated = baseText ? `${baseText} ${interimText}` : interimText;
          if (field === "title") setTitle(updated);
          else setDescription(updated);
        },
        (finalChunk) => {
          baseText = baseText ? `${baseText} ${finalChunk}` : finalChunk;
          if (field === "title") setTitle(baseText);
          else setDescription(baseText);
        },
        () => {
          setActiveDictationField(null);
        },
        (err) => {
          console.warn("Dictation warning:", err);
          setActiveDictationField(null);
        },
      );

      dictationSessionRef.current = session;
      setActiveDictationField(field);
      session.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (dictationSessionRef.current) {
      dictationSessionRef.current.stop();
    }

    let validUrl = url.trim();
    if (validUrl && !/^https?:\/\//i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    const payload: ManualNodePayload = {
      kind,
      title: title.trim(),
      description: description.trim(),
      url: validUrl || undefined,
      parentId: parentId || "core",
    };

    if (isEditing && editingNode && onSubmitEdit) {
      onSubmitEdit(editingNode.id, payload);
    } else {
      onSubmit(payload);
    }

    onClose();
  };

  const coreNode = existingNodes.find((n) => n.kind === "core");
  // Exclude current node from selectable parents when editing to prevent circular self-links
  const selectableNodes = isEditing && editingNode
    ? existingNodes.filter((n) => n.id !== editingNode.id)
    : existingNodes;

  const categoryNodes = selectableNodes.filter((n) => n.kind === "category");
  const ideaNodes = selectableNodes.filter((n) => n.kind === "idea");
  const parentNodeObj = existingNodes.find((n) => n.id === parentId);

  const isTitleRtl =
    isRtlManual !== null
      ? isRtlManual
      : containsArabic(title) || (dictationLang === "ar-SA" && !title);

  const isDescRtl =
    isRtlManual !== null
      ? isRtlManual
      : containsArabic(description) || (dictationLang === "ar-SA" && !description);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/85 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#F5F5DC]/40 bg-[#000000] p-6 text-[#FFFFFF] shadow-2xl animate-in zoom-in-95 duration-150 relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#F5F5DC]" />
            <h2 className="font-sans text-xs uppercase tracking-[0.28em] text-[#F5F5DC]">
              {isEditing ? "Edit Node" : "The Node Forge"}
            </h2>
          </div>

          {/* RTL Toggle, Dictation Language Toggle & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRtlManual((cur) => (cur === null ? true : cur ? false : null))}
              title="Toggle Text Direction (RTL / LTR / Auto)"
              className="flex h-7 items-center gap-1 rounded-md border border-[#333333] px-2 text-[10px] text-[#F5F5DC] transition-colors hover:border-[#F5F5DC]"
            >
              {isTitleRtl ? <AlignRight size={11} /> : <AlignLeft size={11} />}
              <span>{isRtlManual === null ? "AUTO" : isRtlManual ? "RTL (يمين)" : "LTR (يسار)"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = dictationLang === "ar-SA" ? "en-US" : "ar-SA";
                setDictationLang(next);
                if (isRtlManual === null) {
                  setIsRtlManual(next === "ar-SA");
                }
              }}
              title="Toggle Dictation Language"
              className="flex h-7 items-center gap-1 rounded-md border border-[#333333] px-2 text-[10px] text-[#F5F5DC] transition-colors hover:border-[#F5F5DC]"
            >
              <Globe size={11} />
              <span>{dictationLang === "ar-SA" ? "العربية" : "EN"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg border border-[#333333] p-1.5 text-[#FFFFFF]/50 transition-colors hover:border-[#F5F5DC] hover:text-[#FFFFFF]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Node Type Selection */}
          <div className="space-y-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#FFFFFF]/50">
              Node Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("category")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 transition-all ${
                  kind === "category"
                    ? "border-[#F5F5DC] bg-[#F5F5DC]/10 text-[#F5F5DC]"
                    : "border-[#333333] bg-[#0a0a0a] text-[#FFFFFF]/50 hover:border-[#555555]"
                }`}
              >
                <FolderTree size={14} />
                <span className="font-sans text-xs uppercase tracking-wider font-medium">
                  Category (Planet)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setKind("idea")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 transition-all ${
                  kind === "idea"
                    ? "border-[#F5F5DC] bg-[#F5F5DC]/10 text-[#F5F5DC]"
                    : "border-[#333333] bg-[#0a0a0a] text-[#FFFFFF]/50 hover:border-[#555555]"
                }`}
              >
                <Lightbulb size={14} />
                <span className="font-sans text-xs uppercase tracking-wider font-medium">
                  Idea / Node (Moon)
                </span>
              </button>
            </div>
          </div>

          {/* 2. Parent Connection (Cross-Linking) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#FFFFFF]/50">
                Connected Parent Node
              </label>
              {parentNodeObj && (
                <span className="font-sans text-[9px] text-[#F5F5DC]/80 font-medium">
                  Target: {parentNodeObj.title}
                </span>
              )}
            </div>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border border-[#333333] bg-[#0a0a0a] px-3 py-2 font-sans text-xs text-[#FFFFFF] focus:border-[#F5F5DC] focus:outline-none"
            >
              {coreNode && (
                <option value={coreNode.id} className="bg-[#000000] text-[#FFFFFF]">
                  ★ {coreNode.title} (Central Sun)
                </option>
              )}

              {categoryNodes.length > 0 && (
                <optgroup label="Categories" className="bg-[#000000] text-[#F5F5DC]">
                  {categoryNodes.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#000000] text-[#FFFFFF]">
                      📁 {cat.title}
                    </option>
                  ))}
                </optgroup>
              )}

              {ideaNodes.length > 0 && (
                <optgroup label="Existing Ideas (Cross-Link)" className="bg-[#000000] text-[#F5F5DC]/70">
                  {ideaNodes.map((idea) => (
                    <option key={idea.id} value={idea.id} className="bg-[#000000] text-[#FFFFFF]">
                      ↳ 💡 {idea.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 3. Node Title (RTL Support) + Dictation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#FFFFFF]/50">
                Title (Canvas Label) <span className="text-[#F5F5DC]">*</span>
              </label>
              <button
                type="button"
                onClick={() => toggleDictation("title")}
                title={
                  activeDictationField === "title"
                    ? "Stop dictation"
                    : `Dictate title (${dictationLang === "ar-SA" ? "العربية" : "English"})`
                }
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider transition-colors ${
                  activeDictationField === "title"
                    ? "border border-[#F5F5DC] bg-[#F5F5DC] text-[#000000] animate-pulse"
                    : "border border-[#333333] text-[#F5F5DC]/70 hover:border-[#F5F5DC] hover:text-[#FFFFFF]"
                }`}
              >
                {activeDictationField === "title" ? (
                  <>
                    <MicOff size={10} />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic size={10} />
                    <span>Dictate</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                dir={isTitleRtl ? "rtl" : "ltr"}
                placeholder={
                  isTitleRtl
                    ? kind === "category"
                      ? "مثال: كتب، برمجة، فلسفة..."
                      : "مثال: العمل العميق، الذكاء الاصطناعي..."
                    : kind === "category"
                      ? "e.g., Books, Engineering, Philosophy"
                      : "e.g., Deep Work, Neural Mesh"
                }
                className={`w-full rounded-lg border border-[#333333] bg-[#0a0a0a] px-3.5 py-2 font-sans text-xs text-[#FFFFFF] placeholder:text-[#FFFFFF]/30 focus:border-[#F5F5DC] focus:outline-none ${
                  isTitleRtl ? "text-right" : "text-left"
                }`}
              />
            </div>
          </div>

          {/* 4. Description (RTL Support) + Dictation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#FFFFFF]/50">
                Description / Notes
              </label>
              <button
                type="button"
                onClick={() => toggleDictation("description")}
                title={
                  activeDictationField === "description"
                    ? "Stop dictation"
                    : `Dictate notes (${dictationLang === "ar-SA" ? "العربية" : "English"})`
                }
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider transition-colors ${
                  activeDictationField === "description"
                    ? "border border-[#F5F5DC] bg-[#F5F5DC] text-[#000000] animate-pulse"
                    : "border border-[#333333] text-[#F5F5DC]/70 hover:border-[#F5F5DC] hover:text-[#FFFFFF]"
                }`}
              >
                {activeDictationField === "description" ? (
                  <>
                    <MicOff size={10} />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic size={10} />
                    <span>Dictate</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              dir={isDescRtl ? "rtl" : "ltr"}
              placeholder={
                isDescRtl
                  ? "اكتب تفاصيل وملاحظات الفكرة هنا بشكل كامل..."
                  : "Full details, summary, or thoughts regarding this node..."
              }
              className={`w-full resize-none rounded-lg border border-[#333333] bg-[#0a0a0a] p-3 font-sans text-xs text-[#FFFFFF] placeholder:text-[#FFFFFF]/30 focus:border-[#F5F5DC] focus:outline-none ${
                isDescRtl ? "text-right" : "text-left"
              }`}
            />
          </div>

          {/* 5. Reference Link (Optional) */}
          <div className="space-y-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#FFFFFF]/50 flex items-center gap-1">
              <LinkIcon size={11} className="text-[#F5F5DC]" />
              Reference Link (Optional URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/source-article"
              dir="ltr"
              className="w-full rounded-lg border border-[#333333] bg-[#0a0a0a] px-3.5 py-2 font-sans text-xs text-[#FFFFFF] placeholder:text-[#FFFFFF]/30 focus:border-[#F5F5DC] focus:outline-none text-left"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#FFFFFF]/60 hover:text-[#FFFFFF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-[#F5F5DC] bg-[#F5F5DC] px-5 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#000000] transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {isEditing ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus size={13} strokeWidth={2.5} />
                  Forge Node
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
