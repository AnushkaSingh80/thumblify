import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  colorSchemes,
  type AspectRatio,
  type IThumbnail,
  type ThumbnailStyle,
} from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";
import AspectRatioSelector from "../components/AspectRatioSelector";
import StyleSelector from "../components/StyleSelector";
import ColorSchemeSelector from "../components/ColorSchemeSelector";
import PreviwPanel from "../components/PreviewPanel";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../configs/api";

const Generate = () => {
  const { id } = useParams<{ id?: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [title, setTitle] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [thumbnail, setThumbnail] = useState<IThumbnail | null>(null);
  const [loading, setLoading] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [colorSchemeId, setColorSchemeId] = useState<string>(
    colorSchemes[0].id
  );
  const [style, setStyle] = useState<ThumbnailStyle>("Bold & Graphic");
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  // =======================
  // GENERATE
  // =======================
  const handleGenerate = async () => {
    if (!isLoggedIn) return toast.error("Please login to generate thumbnails");
    if (!title.trim()) return toast.error("Title is required");

    try {
      setLoading(true);

      const payload = {
        title,
        prompt: additionalDetails,
        style,
        aspect_ratio: aspectRatio,
        color_scheme: colorSchemeId,
        text_overlay: true,
      };

      const { data } = await api.post("/api/thumbnail/generate", payload);

      if (data?.thumbnail?._id) {
        navigate(`/generate/${data.thumbnail._id}`);
        toast.success(data.message || "Thumbnail generation started");
      }
    } catch (error: any) {
      setLoading(false);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // =======================
  // FETCH THUMBNAIL (SAFE)
  // =======================
  const fetchThumbnail = async () => {
    if (!id) return;

    try {
      const { data } = await api.get(`/api/user/thumbnail/${id}`);
      const t = data?.thumbnail as IThumbnail | undefined;
      if (!t) return;

      setThumbnail(t);
      setTitle(t.title ?? "");
      setAdditionalDetails(t.user_prompt ?? "");

      setAspectRatio(t.aspect_ratio as AspectRatio);
      setStyle(t.style as ThumbnailStyle);
      setColorSchemeId(t.color_scheme ?? colorSchemes[0].id);

      // ✅ stop loading ONLY when image exists
      if (t.image_url) {
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // =======================
  // POLLING (FIXED)
  // =======================
  useEffect(() => {
    if (!isLoggedIn || !id) return;

    fetchThumbnail();

    if (!loading) return;

    const interval = setInterval(fetchThumbnail, 5000);
    return () => clearInterval(interval);
  }, [id, isLoggedIn, loading]);

  // =======================
  // RESET ON ROUTE CHANGE
  // =======================
  useEffect(() => {
    if (!id) {
      setThumbnail(null);
      setLoading(false);
    }
  }, [pathname, id]);

  return (
    <>
      <SoftBackdrop />

      <div className="pt-24 min-h-screen">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
          <div className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* LEFT */}
            <div className={`space-y-6 ${id ? "pointer-events-none" : ""}`}>
              <div className="p-6 rounded-2xl border border-white/8 bg-white/12 shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-1">
                    Create Your Thumbnail
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Describe your vision and let AI bring it to life
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Title or Topic
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-lg border-white/12 bg-black/20"
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-zinc-400">
                        {title.length}/100
                      </span>
                    </div>
                  </div>

                  <AspectRatioSelector
                    value={aspectRatio}
                    onChange={setAspectRatio}
                  />
                  <StyleSelector
                    value={style}
                    onChange={setStyle}
                    isOpen={styleDropdownOpen}
                    setIsOpen={setStyleDropdownOpen}
                  />
                  <ColorSchemeSelector
                    value={colorSchemeId}
                    onChange={setColorSchemeId}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Additional Prompts
                    </label>
                    <textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border-white/10 bg-white/6 resize-none"
                    />
                  </div>
                </div>

                {!id && (
                  <button
                    onClick={handleGenerate}
                    className="w-full py-3.5 rounded-xl bg-pink-600"
                  >
                    {loading ? "Generating..." : "Generate Thumbnail"}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-start">
              <div className="flex-1 p-6 rounded-2xl bg-white/8 border border-white/10">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">
                  Preview
                </h2>
                <PreviwPanel
                  thumbnail={thumbnail}
                  isLoading={loading}
                  aspectRatio={aspectRatio}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Generate;
