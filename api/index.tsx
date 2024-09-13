import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';

const WARPCAST_API_KEY = process.env.WARPCAST_API_KEY ?? '0D6B6425-87D9-4548-95A2-36D107C12421';
const CAST_ID = '0x5d38e284';  // Replace with your actual cast ID
const FOLLOWEE_ID = '791835';  // Replace with the Farcaster ID of the account to check follow status for

// Function to get reactions (likes or recasts) on a cast
async function getReactions(castId: string): Promise<any> {
  const response = await fetch(`https://api.warpcast.com/v2/reactions?castId=${castId}`, {
    headers: { 'Authorization': `Bearer ${WARPCAST_API_KEY}` }
  });
  const data = await response.json();
  return data;
}

// Function to check if a user has liked or recasted a cast
async function hasUserReacted(fid: string, castId: string): Promise<boolean> {
  const reactions = await getReactions(castId);
  const hasLiked = reactions.likes.some((reaction: any) => reaction.user.fid === fid);
  const hasRecasted = reactions.recasts.some((reaction: any) => reaction.user.fid === fid);
  return hasLiked && hasRecasted;
}

// Function to check if a user follows another user
async function checkFollowStatus(followerFid: string, followeeFid: string): Promise<boolean> {
  const response = await fetch(`https://api.warpcast.com/v2/follows?followerFid=${followerFid}&followeeFid=${followeeFid}`, {
    headers: { 'Authorization': `Bearer ${WARPCAST_API_KEY}` }
  });
  const data = await response.json();
  return data.isFollowing;
}

// Function to check if a user has liked, recasted, and followed
async function checkInteractions(fid: string): Promise<boolean> {
  try {
    const hasReacted = await hasUserReacted(fid, CAST_ID);
    const isFollowing = await checkFollowStatus(fid, FOLLOWEE_ID);
    return hasReacted && isFollowing;
  } catch (error) {
    console.error('Error checking interactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Check Interactions with Warpcast',
});

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;
  const fid = hub?.interactor?.fid;  // Get the user's Farcaster ID (fid)

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
        <Button value="enter">Enter</Button>,  // Simple Enter button
      ],
    });
  }

  if (fid) {
    const hasInteracted = await checkInteractions(fid);

    if (hasInteracted) {
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
    return c.res({
      image: <div style={{ color: 'white', fontSize: 60 }}>Error: No Farcaster ID found.</div>
    });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
