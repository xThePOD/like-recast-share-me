import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import axios from 'axios';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? 'default-api-key';
const CAST_ID = process.env.CAST_ID;
const FARCASTER_API_URL = 'https://api.farcaster.xyz/v1/reactions';  // Adjust for correct endpoint

// Check if the user has liked, recasted, and followed
async function checkInteractions(fid: string): Promise<boolean> {
  try {
    const response = await axios.post(FARCASTER_API_URL, {
      id: {
        message_id: CAST_ID,
      },
      type: 'LIKE',  // or 'RECAST'
    }, {
      headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
    });

    const reactions = response.data.reactions;
    const hasLikedOrRecast = reactions.some((reaction: any) => reaction.fid === fid);

    return hasLikedOrRecast;  // Check for both likes and recasts
  } catch (error) {
    console.error('Error checking reactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Prompt for Follow, Like, Recast',
}).use(neynar({
  apiKey: NEYNAR_API_KEY,
  features: ['interactor'],
}));

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;

  // If the user presses "Enter"
  if (!buttonValue || buttonValue !== 'enter') {
    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
            Press Enter
          </div>
        </div>
      ),
      intents: [
        <Button value="enter">Enter</Button>,
      ],
    });
  }

  const fid = hub?.interactor?.fid;  // Get the Farcaster user ID (fid)

  if (fid) {
    const hasInteracted = await checkInteractions(fid);

    if (hasInteracted) {
      // If the user has liked and recasted, show the "Welcome to the POD" message
      return c.res({
        image: (
          <div style={{
            alignItems: 'center',
            background: 'linear-gradient(to right, #432889, #17101F)',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}>
            <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
              Welcome to the POD!
            </div>
          </div>
        ),
      });
    } else {
      // Show the overlay/modal if they haven't liked/recasted
      return c.res({
        image: (
          <div style={{
            alignItems: 'center',
            background: 'linear-gradient(to right, #432889, #17101F)',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            position: 'relative',
          }}>
            <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
              You have to follow, like, and recast first
            </div>
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              position: 'absolute',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '20px',
              borderRadius: '10px',
            }}>
              <Button.Link href={`https://warpcast.com/~/cast/${CAST_ID}`}>Follow, Like, and Recast</Button.Link>
            </div>
          </div>
        ),
        intents: [
          <Button value="enter">Try Again</Button>,  // Retry button to check interactions again
        ],
      });
    }
  } else {
    return c.res({
      image: <div style={{ color: 'white', fontSize: 60 }}>Error: No Farcaster ID found.</div>
    });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
