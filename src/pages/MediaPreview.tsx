import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { get } from "@/backend/metadata/tmdb";
import { Button } from "@/components/buttons/Button";
import { ThiccContainer } from "@/components/layout/ThinContainer";
import { conf } from "@/setup/config";

import { SubPageLayout } from "./layouts/SubPageLayout";
import { Icon, Icons } from "../components/Icon";
import { PageTitle } from "./parts/util/PageTitle";

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
  backdrops: { file_path: string }[];
}

export function MediaPreview() {
  const { t } = useTranslation();
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMediaData = async () => {
      try {
        const [detailsData, creditsData, imagesData] = await Promise.all([
          get<MediaDetails>(`/${mediaType}/${id}`, {
            api_key: conf().TMDB_READ_API_KEY,
            language: "en-US",
          }),
          get<Credits>(`/${mediaType}/${id}/credits`, {
            api_key: conf().TMDB_READ_API_KEY,
          }),
          get<Images>(`/${mediaType}/${id}/images`, {
            api_key: conf().TMDB_READ_API_KEY,
          }),
        ]);

        setMediaDetails(detailsData);
        setCredits(creditsData);
        setImages(imagesData);
      } catch (error) {
        console.error("Error fetching media data:", error);
      }
    };

    fetchMediaData();
  }, [mediaType, id]);

  const handleWatchNow = () => {
    const title = mediaDetails?.title || mediaDetails?.name || "";
    navigate(`/media/tmdb-${mediaType}-${id}-${title}`);
  };

  if (!mediaDetails || !credits || !images) {
    return <div>Loading...</div>;
  }

  const title = mediaDetails.title || mediaDetails.name || "";
  const releaseDate = mediaDetails.release_date || mediaDetails.first_air_date;
  const runtime = mediaDetails.runtime || mediaDetails.episode_run_time?.[0];
  const backdropUrl = mediaDetails.backdrop_path
    ? `https://image.tmdb.org/t/p/original${mediaDetails.backdrop_path}`
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
      </Helmet>
      <PageTitle subpage k={`${title} Preview`} />
      {backdropUrl && (
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            filter: "blur(8px)",
            opacity: 0.3,
            zIndex: -1,
          }}
        />
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
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            {mediaDetails.tagline && (
              <p className="text-gray-400 italic mb-4">
                {mediaDetails.tagline}
              </p>
            )}
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
      </ThiccContainer>
    </SubPageLayout>
  );
}
