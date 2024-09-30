import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";

import { get } from "@/backend/metadata/tmdb";
import { Ad } from "@/components/Ad";
import { Button } from "@/components/buttons/Button";
import { ThiccContainer } from "@/components/layout/ThinContainer";
import { MediaBookmarkButton } from "@/components/media/MediaBookmark";
import { conf } from "@/setup/config";
import { MediaItem } from "@/utils/mediaTypes";
import { cleanTitle } from "@/utils/title";

import { SubPageLayout } from "./layouts/SubPageLayout";
import { Icon, Icons } from "../components/Icon";

interface FAQ {
  question: string;
  answer: string;
}

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

interface Video {
  key: string;
  site: string;
  type: string;
}

interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

interface Trivia {
  id: string;
  content: string;
}

function Spinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900" />
    </div>
  );
}

const LazyImage: React.FC<{ src: string; alt: string; className: string }> =
  React.memo(
    ({
      src,
      alt,
      className,
    }: {
      src: string;
      alt: string;
      className: string;
    }) => {
      const [isLoaded, setIsLoaded] = useState(false);
      const [isInView, setIsInView] = useState(false);
      const imgRef = React.useRef<HTMLDivElement>(null);

      useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          },
          { threshold: 0.1 },
        );

        const currentImgRef = imgRef.current; // Capture the current value

        if (currentImgRef) {
          observer.observe(currentImgRef);
        }

        return () => {
          if (currentImgRef) {
            observer.unobserve(currentImgRef);
          }
        };
      }, []);

      return (
        <div ref={imgRef} className={`${className} bg-gray-300`}>
          {isInView && (
            <img
              src={src}
              alt={alt}
              className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
              onLoad={() => setIsLoaded(true)}
            />
          )}
        </div>
      );
    },
  );

function FAQItem({
  faq,
  isOpen,
  toggleFAQ,
}: {
  faq: FAQ;
  isOpen: boolean;
  toggleFAQ: () => void;
}) {
  return (
    <div className="border-b border-gray-700">
      <Button
        className="flex justify-between items-center w-full py-4 px-6 text-left focus:outline-none"
        onClick={toggleFAQ}
        theme="secondary"
      >
        <span className="text-lg font-semibold text-white">{faq.question}</span>
        <Icon
          icon={isOpen ? Icons.CHEVRON_UP : Icons.CHEVRON_DOWN}
          className={`text-white transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
        />
      </Button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="py-4 px-6 text-gray-300">{faq.answer}</p>
      </div>
    </div>
  );
}

function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);

  function toggleFAQ(index: number) {
    setOpenFAQs((prev: number[]) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">
        Frequently Asked Questions
      </h2>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {faqs.map((faq, index) => (
          <FAQItem
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            faq={faq}
            isOpen={openFAQs.includes(index)}
            toggleFAQ={() => toggleFAQ(index)}
          />
        ))}
      </div>
    </div>
  );
}

export function MediaPreview() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [relatedMedia, setRelatedMedia] = useState<RelatedMedia[]>([]);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [trivia, setTrivia] = useState<Trivia[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getBestBackdrop = useCallback((tmpImages: Images) => {
    if (tmpImages.backdrops.length === 0) return null;
    return tmpImages.backdrops.reduce((prev, current) =>
      prev.vote_average > current.vote_average ? prev : current,
    ).file_path;
  }, []);

  useEffect(() => {
    const fetchMediaData = async () => {
      setLoading(true);
      try {
        const mediaId = id?.split("-") ?? [id];
        const [
          detailsData,
          creditsData,
          imagesData,
          relatedData,
          videosData,
          reviewsData,
          triviaData,
        ] = await Promise.all([
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
            `/${mediaType}/${mediaId[0]}/recommendations`,
            {
              api_key: conf().TMDB_READ_API_KEY,
              language: "en-US",
            },
          ),
          get<{ results: Video[] }>(`/${mediaType}/${mediaId[0]}/videos`, {
            api_key: conf().TMDB_READ_API_KEY,
          }),
          get<{ results: Review[] }>(`/${mediaType}/${mediaId[0]}/reviews`, {
            api_key: conf().TMDB_READ_API_KEY,
          }),
          // Note: TMDB doesn't have a trivia endpoint, so this is a placeholder
          Promise.resolve({ results: [] as Trivia[] }),
        ]);

        setMediaDetails(detailsData);
        setCredits(creditsData);
        setImages(imagesData);
        setRelatedMedia(relatedData.results.slice(0, 6));
        setTrailer(
          videosData.results.find(
            (video) => video.type === "Trailer" && video.site === "YouTube",
          ) || null,
        );
        setReviews(reviewsData.results.slice(0, 3));
        setTrivia(triviaData.results);
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

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = mediaDetails?.title || mediaDetails?.name || "";
    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=Check out ${title}&url=${url}`,
          "_blank",
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${url}`,
          "_blank",
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
          "_blank",
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`Watch ${title} with me at: ${url}`)}`,
          "_blank",
        );
        break;
      default:
        break;
    }
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

  const faqs: FAQ[] = [
    {
      question: `Where can I watch ${title}?`,
      answer: `You can watch ${title} right here on our website. Just click the 'Watch Now' button to start streaming in 4K with support for HDR-10, HDR-10+, and Dolby Atmos.`,
    },
    {
      question: `Is ${title} available for free?`,
      answer: `We offer a selection of free content, but some titles may require a subscription or rental fee. Check the 'Watch Now' button for specific details about ${title}.`,
    },
    {
      question: `What is the release date of ${title}?`,
      answer: `${title} was released on ${releaseDate || "N/A"}. You can stream it on our platform now!`,
    },
    {
      question: `Who are the main actors in ${title}?`,
      answer: `The main cast of ${title} includes ${credits.cast
        .slice(0, 3)
        .map((actor) => actor.name)
        .join(", ")}.`,
    },
    {
      question: `What genre is ${title}?`,
      answer: `${title} is classified as ${mediaDetails.genres.map((g) => g.name).join(", ")}.`,
    },
  ];

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
      reviewCount: reviews.length ?? 7,
    },
    director: credits.crew.find((person) => person.job === "Director")?.name,
    actor: credits.cast.slice(0, 5).map((actor) => ({
      "@type": "Person",
      name: actor.name,
    })),
    duration: runtime ? `PT${runtime}M` : undefined,
    genre: mediaDetails.genres.map((genre) => genre.name),
    review: reviews.map((review) => ({
      "@type": "Review",
      reviewBody: review.content,
      author: {
        "@type": "Person",
        name: review.author,
      },
      datePublished: review.created_at,
    })),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const mediaItem: MediaItem = {
    id: mediaDetails.id.toString(),
    title: mediaDetails.title || mediaDetails.name || "",
    year: releaseDate ? new Date(releaseDate).getFullYear() : undefined,
    release_date: releaseDate ? new Date(releaseDate) : undefined,
    type: mediaType === "movie" ? "movie" : "show",
    poster: mediaDetails.poster_path
      ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
      : undefined,
  };

  return (
    <SubPageLayout>
      <Helmet>
        <title>{`${title} - Watch Now`}</title>
        <meta
          name="description"
          content={`Stream ${title} online. ${mediaDetails.overview}`}
        />
        <meta
          name="keywords"
          content={`watch ${title}, ${mediaType}, ${mediaDetails.genres.map((g) => g.name).join(", ")}, streaming, online`}
        />
        <meta property="og:title" content={`${title} - Watch Now`} />
        <meta property="og:description" content={mediaDetails.overview} />
        <meta
          property="og:image"
          content={`https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`}
        />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={window.location.href} />
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
          <LazyImage
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
            <LazyImage
              src={`https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`}
              alt={title}
              className="w-full rounded-xl shadow-lg"
            />
          </div>
          <div className="w-full md:w-2/3">
            <p className="text-gray-300 mb-4">{mediaDetails.overview}</p>
            <p className="mt-2 mb-4">
              Released in {mediaDetails.release_date?.slice(0, 4) || "N/A"},{" "}
              {title} is a {mediaDetails.genres.map((g) => g.name).join(", ")}{" "}
              {mediaType}. Directed by{" "}
              {credits.crew.find((person) => person.job === "Director")?.name ||
                "Unknown"}
              , it features{" "}
              {credits.cast
                .slice(0, 3)
                .map((actor) => actor.name)
                .join(", ")}{" "}
              in leading roles.
            </p>
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
            <div className="flex flex-col sm:flex-row justify-center items-center mb-10 mt-10 space-y-4 sm:space-y-0 sm:space-x-8">
              <Ad type="468" className="my-4" />
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center mb-10 mt-10 space-y-4 sm:space-y-0 sm:space-x-8">
              <Button
                theme="purple"
                onClick={handleWatchNow}
                className="w-full sm:w-auto bg-primary-main hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-full transition duration-300 text-lg"
              >
                <Icon icon={Icons.PLAY} className="mr-2" />
                Watch Now
              </Button>
              <MediaBookmarkButton media={mediaItem} showWording />
            </div>
            <div className="flex justify-center space-x-4 mb-6">
              <Button
                onClick={() => handleShare("twitter")}
                aria-label="Share on Twitter"
                className="text-blue-400 hover:text-blue-600"
              >
                <Icon icon={Icons.TWITTER} />
              </Button>
              <Button
                onClick={() => handleShare("facebook")}
                aria-label="Share on Facebook"
                className="text-blue-600 hover:text-blue-800"
              >
                <Icon icon={Icons.FACEBOOK} />
              </Button>
              <Button
                onClick={() => handleShare("whatsapp")}
                aria-label="Share on WhatsApp"
                className="text-green-500 hover:text-green-700"
              >
                <Icon icon={Icons.WHATSAPP} />
              </Button>
            </div>
          </div>
        </div>

        {trailer && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Trailer</h2>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title="Trailer"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-white mb-4 mt-8">Cast</h2>
        <div className="flex overflow-x-auto space-x-4 mb-6">
          {credits.cast.slice(0, 10).map((actor) => (
            <div key={actor.id} className="flex-shrink-0 w-24">
              <LazyImage
                src={
                  actor.profile_path
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : "https://placehold.co/24x42"
                }
                alt={actor.name}
                className="w-24 h-24 object-cover rounded-full mb-2"
              />
              <p className="text-center text-sm text-gray-300">{actor.name}</p>
              <p className="text-center text-xs text-gray-400">
                {actor.character}
              </p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Photo Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.backdrops.slice(0, 6).map((image, index) => (
            <LazyImage
              // eslint-disable-next-line react/no-array-index-key
              key={`screenshot-${index}`}
              src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
              alt={`${title} screenshot ${index + 1}`}
              className="w-full rounded-lg"
            />
          ))}
        </div>

        {reviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Reviews</h2>
            {reviews.map((review) => (
              <div key={review.id} className="mb-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-white font-bold">{review.author}</p>
                <p className="text-gray-300">
                  {review.content.slice(0, 200)}...
                </p>
              </div>
            ))}
          </div>
        )}

        {trivia.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Trivia</h2>
            <ul className="list-disc list-inside text-gray-300">
              {trivia.map((item) => (
                <li key={item.id} className="mb-2">
                  {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

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
            Recommended {mediaType === "movie" ? "Movies" : "Shows"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedMedia.map((media) => (
              <div
                key={media.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate(
                    `/details/${mediaType}/${media.id}-${cleanTitle(media.name || media.title || "")}`,
                  )
                }
              >
                <LazyImage
                  src={`https://image.tmdb.org/t/p/w300${media.poster_path}`}
                  alt={media.title || media.name || ""}
                  className="w-full rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <p className="text-sm text-gray-300 mt-2">
                  {media.title || media.name}
                </p>
              </div>
            ))}
          </div>
          <FAQSection faqs={faqs} />
        </div>
      </ThiccContainer>
    </SubPageLayout>
  );
}

export default MediaPreview;
