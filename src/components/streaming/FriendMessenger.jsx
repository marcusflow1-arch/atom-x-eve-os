import MessengerApp from './MessengerApp';

export default function FriendMessenger({ friend, onClose }) {
  return <MessengerApp onClose={onClose} />;
}