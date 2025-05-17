import { Dispatch, FormEvent, PointerEvent, SetStateAction } from 'react'
import '../app/loops-styles.css' // Renamed CSS import path

interface StoryStreamProps {
  storyTitle?: string
  storySubtitle?: string
  storySegments?: string[]
  city: string
  setCity: Dispatch<SetStateAction<string>>
  weatherResponse: string
  weatherError: string
  handleWeatherSubmit: (event: FormEvent<HTMLFormElement>) => void
  isStoryPanelOpen: boolean
  setLastDirectInputTime: Dispatch<SetStateAction<number>>
  scrollProgress: number // Added from LoopsApp
}

export default function StoryStream({
  storyTitle,
  storySubtitle,
  storySegments,
  city,
  setCity,
  weatherResponse,
  weatherError,
  handleWeatherSubmit,
  isStoryPanelOpen,
  setLastDirectInputTime,
}: StoryStreamProps) {
  const titleAreaStyle = {
    // backgroundColor: `rgba(30, 30, 30, ${backgroundTintAlpha.toFixed(3)})`, // Already commented out
  }

  const TitleArea = (
    <div
      className="story-title-area"
      style={titleAreaStyle} // Apply dynamic style
    >
      <h2 dangerouslySetInnerHTML={{ __html: storyTitle || 'Story Title' }} />
      {storySubtitle && (
        <h4
          className="story-subtitle"
          dangerouslySetInnerHTML={{ __html: storySubtitle }}
        />
      )}
    </div>
  )

  const StoryContentSection = (
    <div id="story-content-collapsible" className={`story-content-wrapper`}>
      {!storySegments || storySegments.length === 0 ? (
        <p style={{ textAlign: 'center', paddingTop: '20px' }}>
          Loading story...
        </p>
      ) : (
        <>
          <div className="story-content">
            {storySegments.map((segment, index) => (
              <div key={index} className="story-segment">
                <div
                  className="story-segment-content"
                  dangerouslySetInnerHTML={{ __html: segment }}
                />
                {index < storySegments.length - 1 && (
                  <div className="segment-divider"></div>
                )}
              </div>
            ))}
          </div>
          {isStoryPanelOpen && (
            <div
              className="weather-input-container"
              style={{
                padding: '20px',
                background: 'rgba(30,30,30,0.8)',
                borderRadius: '0 0 10px 10px',
                marginTop: '20px',
                marginBottom: '20px',
              }}
              onPointerDown={(e: PointerEvent<HTMLDivElement>) =>
                e.stopPropagation()
              } // Stop event propagation
              onPointerUp={(e: PointerEvent<HTMLDivElement>) =>
                e.stopPropagation()
              } // Stop event propagation
            >
              <form
                onSubmit={handleWeatherSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setLastDirectInputTime(Date.now())
                  }}
                  placeholder="Enter city for weather"
                  style={{
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #555',
                    background: '#444',
                    color: '#eee',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px',
                    borderRadius: '5px',
                    border: 'none',
                    background: '#007bff',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Get Weather
                </button>
              </form>
              {weatherError && (
                <p style={{ color: 'red', marginTop: '10px' }}>
                  {weatherError}
                </p>
              )}
              {weatherResponse && !weatherError && (
                <p
                  style={{
                    color: '#eee',
                    marginTop: '10px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <strong>Weather:</strong>
                  <br />
                  {weatherResponse}
                </p>
              )}
            </div>
          )}
          <div className="bottom-spacer"></div>{' '}
          {/* Spacer is now after the weather form */}
        </>
      )}
    </div>
  )

  return (
    <div className="story-stream">
      {TitleArea}
      {StoryContentSection}
    </div>
  )
}
