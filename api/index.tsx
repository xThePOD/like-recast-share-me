import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? '0D6B6425-87D9-4548-95A2-36D107C12421';
const CAST_ID = process.env.CAST_ID ?? '0x5d38e2845446c8461ed7de820b46b1d0b3b6fad9';
const USER_FOLLOWER_ID = process.env.FOLLOW_ID ?? '791835';

// Check if the user has liked, recasted, and followed the cast using Neynar API
async function checkInteractions(fid: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=${CAST_ID}&type=hash`, {
      headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
    });
    const data = await response.json();

    const cast = data.cast;
    const hasLiked = cast.reactions.likes.some((like: any) => like.fid === fid);
    const hasRecasted = cast.reactions.recasts.some((recast: any) => recast.fid === fid);

    // Check if the user follows a certain account (Optional)
    const followResponse = await fetch(`https://api.neynar.com/v2/farcaster/following/${fid}`, {
      headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
    });
    const followData = await followResponse.json();
    const hasFollowed = followData.following.some((follow: any) => follow.fid === USER_FOLLOWER_ID);

    return hasLiked && hasRecasted && hasFollowed;
  } catch (error) {
    console.error('Error checking interactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Check Interactions and Proceed to Welcome',
}).use(neynar({
  apiKey: NEYNAR_API_KEY,
  features: ['interactor'],
}));

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;
  const fid = hub?.interactor?.fid;  // Detect user's Farcaster ID

  // If the user has not pressed the button yet, show the initial frame
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

  // If the user pressed the Enter button, check interactions
  if (fid) {
    const hasInteracted = await checkInteractions(fid);

    if (hasInteracted) {
      // If the user has liked, recasted, and followed, show the welcome message
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
      // If the user hasn't liked, recasted, or followed, prompt them to do so
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
              Please like, recast, and follow to proceed.
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
              <Button.Link href={`https://warpcast.com/~/cast/${CAST_ID}`}>Like, Recast, and Follow</Button.Link>
            </div>
          </div>
        ),
      });
    }
  } else {
    // If the Farcaster ID is not found, show an error message
    return c.res({
      image: <div style={{ color: 'white', fontSize: 60 }}>Error: No Farcaster ID found.</div>
    });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
