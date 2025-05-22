import { Dispatch, FormEvent, PointerEvent, SetStateAction } from 'react'
import '../app/loops-styles.css' // Renamed CSS import path

interface StoryStreamProps {
  storyTitle?: string
  storySubtitle?: string
  storySegments?: string[]
  continuationResponse: string
  continuationError: string
  handleConversationContinue: (event: FormEvent<HTMLFormElement>) => void
  isStoryPanelOpen: boolean
  setLastDirectInputTime: Dispatch<SetStateAction<number>>
  scrollProgress: number // Added from LoopsApp
  currentUserInput: string // Added for user text input
  setCurrentUserInput: Dispatch<SetStateAction<string>> // Added for user text input
  footerHtml?: string // New prop for combined footer HTML
}

export default function StoryStream({
  storyTitle,
  storySubtitle,
  storySegments,
  continuationResponse,
  continuationError,
  handleConversationContinue,
  isStoryPanelOpen,
  setLastDirectInputTime,
  currentUserInput, // Added for user text input
  setCurrentUserInput, // Added for user text input
  footerHtml, // Destructure new prop
}: StoryStreamProps) {
  // const [isButtonPressed, setIsButtonPressed] = useState(false); // Removed unused state

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
              className="conversation-input-container"
              style={{
                padding: '15px 20px 20px 20px',
                background: 'rgba(50, 50, 50, 0.65)',
                borderRadius: '10px', // Rounded all corners
                marginTop: '5px', // Further reduced marginTop
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
                onSubmit={handleConversationContinue}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    gap: '10px', // Increased gap to 10px
                  }}
                >
                  <input
                    type="text"
                    value={currentUserInput}
                    onChange={(e) => {
                      setCurrentUserInput(e.target.value)
                      setLastDirectInputTime(Date.now())
                    }}
                    placeholder="Continue the conversation?"
                    style={{
                      padding: '10px',
                      borderRadius: '5px',
                      border: 'none',
                      outline: 'none', // Removed focus glow
                      background: 'rgba(80, 80, 80, 0.6)', // New lighter, more transparent style
                      color: '#eee',
                      flexGrow: 1,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="submit"
                    // Pointer events related to isButtonPressed were already commented out/removed
                    style={{
                      background: 'rgba(95, 95, 95, 0.6)',
                      border: 'none',
                      color: '#ddd',
                      padding: '10px 15px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      lineHeight: '1.5',
                      // transform: 'scale(1)', // Ensure no lingering transform
                      // transition: 'transform 0.05s ease-out, background-color 0.05s ease-out', // Transition not needed without active state change
                    }}
                  >
                    ➔
                  </button>
                </div>
              </form>
              {continuationError && (
                <p style={{ color: 'red', marginTop: '10px' }}>
                  {continuationError}
                </p>
              )}
              {continuationResponse && !continuationError && (
                <p
                  style={{
                    color: '#eee',
                    marginTop: '10px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <strong>Friend:</strong>
                  <br />
                  {continuationResponse}
                </p>
              )}
            </div>
          )}
          {/* Footer section for dedication and GitHub link, rendered if panel is open and content exists */}
          {isStoryPanelOpen && footerHtml && (
            <div
              className="story-footer-links"
              style={{
                textAlign: 'center',
                padding: '15px 0px',
                borderTop: '1px solid #444', // Optional: adds a separator
                marginTop: '0px',
              }}
              dangerouslySetInnerHTML={{ __html: footerHtml }} // Render combined footer
            />
          )}
          <div className="bottom-spacer"></div>
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
