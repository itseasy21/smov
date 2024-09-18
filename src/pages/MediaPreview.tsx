import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";

import { get } from "@/backend/metadata/tmdb";
import { Button } from "@/components/buttons/Button";
import { ThiccContainer } from "@/components/layout/ThinContainer";
import { conf } from "@/setup/config";
import { cleanTitle } from "@/utils/title";

import { SubPageLayout } from "./layouts/SubPageLayout";
import { Icon, Icons } from "../components/Icon";

interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  production_companies: { name: string; logo_path: string }[];
  tagline?: string;
  status: string;
  original_language: string;
}

interface Credits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    profile_path: string;
  }[];
}

interface Images {
  backdrops: {
    file_path: string;
    vote_average: number;
  }[];
}

interface RelatedMedia {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
}

function Spinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900" />
    </div>
  );
}

export function MediaPreview() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [relatedMedia, setRelatedMedia] = useState<RelatedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const getBestBackdrop = (tmpImages: Images) => {
    if (tmpImages.backdrops.length === 0) return null;
    return tmpImages.backdrops.reduce((prev, current) =>
      prev.vote_average > current.vote_average ? prev : current,
    ).file_path;
  };

  useEffect(() => {
    const fetchMediaData = async () => {
      setLoading(true);
      try {
        const mediaId = id?.split("-") ?? [id];
        const [detailsData, creditsData, imagesData, relatedData] =
          await Promise.all([
            get<MediaDetails>(`/${mediaType}/${mediaId[0]}`, {
              api_key: conf().TMDB_READ_API_KEY,
              language: "en-US",
            }),
            get<Credits>(`/${mediaType}/${mediaId[0]}/credits`, {
              api_key: conf().TMDB_READ_API_KEY,
            }),
            get<Images>(`/${mediaType}/${mediaId[0]}/images`, {
              api_key: conf().TMDB_READ_API_KEY,
            }),
            get<{ results: RelatedMedia[] }>(
              `/${mediaType}/${mediaId[0]}/similar`,
              {
                api_key: conf().TMDB_READ_API_KEY,
                language: "en-US",
              },
            ),
          ]);

        setMediaDetails(detailsData);
        setCredits(creditsData);
        setImages(imagesData);
        setRelatedMedia(relatedData.results.slice(0, 6));
      } catch (error) {
        console.error("Error fetching media data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaData();
  }, [mediaType, id]);

  const handleWatchNow = () => {
    const title = mediaDetails?.title || mediaDetails?.name || "";
    navigate(`/media/tmdb-${mediaType}-${id}-${cleanTitle(title)}`);
  };

  if (loading) {
    return <Spinner />;
  }

  if (!mediaDetails || !credits || !images) {
    return <div>Error loading media details</div>;
  }

  const title = mediaDetails.title || mediaDetails.name || "";
  const releaseDate = mediaDetails.release_date || mediaDetails.first_air_date;
  const runtime = mediaDetails.runtime || mediaDetails.episode_run_time?.[0];
  const bestBackdropPath = getBestBackdrop(images);
  const heroImageUrl = bestBackdropPath
    ? `https://image.tmdb.org/t/p/original${bestBackdropPath}`
    : null;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": mediaType === "movie" ? "Movie" : "TVSeries",
    name: title,
    description: mediaDetails.overview,
    image: `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`,
    datePublished: releaseDate,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: mediaDetails.vote_average,
      bestRating: "10",
      worstRating: "0",
    },
    director: credits.crew.find((person) => person.job === "Director")?.name,
    actor: credits.cast.slice(0, 5).map((actor) => ({
      "@type": "Person",
      name: actor.name,
    })),
    duration: runtime ? `PT${runtime}M` : undefined,
    genre: mediaDetails.genres.map((genre) => genre.name),
  };

  return (
    <SubPageLayout>
      <Helmet>
        <title>{`${title} - Preview`}</title>
        <meta name="description" content={mediaDetails.overview} />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
        <style type="text/css">{`
            html, body {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          `}</style>
      </Helmet>

      {heroImageUrl && (
        <div
          className="relative w-full h-[40vh] mb-8 overflow-hidden"
          style={{ marginTop: "-90px" }}
        >
          <img
            src={heroImageUrl}
            alt={`${title} backdrop`}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
            <ThiccContainer classNames="h-full flex flex-col justify-end pb-8">
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
              {mediaDetails.tagline && (
                <p className="text-xl text-gray-300 italic">
                  {mediaDetails.tagline}
                </p>
              )}
            </ThiccContainer>
          </div>
        </div>
      )}

      <ThiccContainer>
        <div className="flex flex-col md:flex-row items-start mt-8">
          <div className="w-full md:w-1/3 mb-6 md:mb-0 md:mr-8">
            <img
              src={`https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`}
              alt={title}
              className="w-full rounded-xl shadow-lg"
            />
          </div>
          <div className="w-full md:w-2/3">
            <p className="text-gray-300 mb-4">{mediaDetails.overview}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center">
                <Icon icon={Icons.CLOCK} className="text-gray-400 mr-2" />
                <span className="text-gray-300">{releaseDate}</span>
              </div>
              <div className="flex items-center">
                <Icon icon={Icons.STAR} className="text-yellow-400 mr-2" />
                <span className="text-gray-300">
                  {mediaDetails.vote_average.toFixed(1)}
                </span>
              </div>
              {runtime && (
                <div className="flex items-center">
                  <Icon icon={Icons.TIMER} className="text-gray-400 mr-2" />
                  <span className="text-gray-300">{runtime} min</span>
                </div>
              )}
              <div className="flex items-center">
                <Icon icon={Icons.TAG} className="text-gray-400 mr-2" />
                <span className="text-gray-300">
                  {mediaDetails.genres.map((g) => g.name).join(", ")}
                </span>
              </div>
            </div>
            {/* Ad Slot 1 */}
            <div className="flex justify-center mb-6 mt-4">
              <Button
                theme="secondary"
                onClick={handleWatchNow}
                className="bg-primary-main hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full transition duration-300"
              >
                Watch Now
              </Button>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Cast</h2>
            <div className="flex overflow-x-auto space-x-4 mb-6">
              {credits.cast.slice(0, 10).map((actor) => (
                <div key={actor.id} className="flex-shrink-0 w-24">
                  <img
                    src={
                      actor.profile_path
                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                        : "https://placehold.co/24x42"
                    }
                    alt={actor.name}
                    className="w-24 h-24 object-cover rounded-full mb-2"
                  />
                  <p className="text-center text-sm text-gray-300">
                    {actor.name}
                  </p>
                  <p className="text-center text-xs text-gray-400">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Screenshots</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.backdrops.slice(0, 6).map((image, index) => (
                <img
                  // eslint-disable-next-line react/no-array-index-key
                  key={`screenshot-${index}`}
                  src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                  alt={`${title} screenshot ${index + 1}`}
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Additional Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-300">Status</h3>
              <p className="text-gray-400">{mediaDetails.status}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Original Language
              </h3>
              <p className="text-gray-400">{mediaDetails.original_language}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Production Companies
              </h3>
              <p className="text-gray-400">
                {mediaDetails.production_companies
                  .map((company) => company.name)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Related {mediaType === "movie" ? "Movies" : "Shows"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedMedia.map((media) => (
              <div
                key={media.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate(
                    `/details/${mediaType}/${media.id}-${cleanTitle(media.name || media.title)}`,
                  )
                }
              >
                <img
                  src={`https://image.tmdb.org/t/p/w300${media.poster_path}`}
                  alt={media.title || media.name}
                  className="w-full rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <p className="text-sm text-gray-300 mt-2">
                  {media.title || media.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ThiccContainer>
    </SubPageLayout>
  );
}
