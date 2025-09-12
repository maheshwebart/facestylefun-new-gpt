import React from 'react';

interface ShareButtonsProps {
  imageSrc: string | null;
}

const ShareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
);


const ShareButtons: React.FC<ShareButtonsProps> = ({ imageSrc }) => {
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    // @ts-ignore
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleShare = async () => {
    if (!imageSrc) return;

    if (navigator.share) {
      try {
        const file = dataURLtoFile(imageSrc, `facestyle.fun-${Date.now()}.png`);
        await navigator.share({
          title: 'Check out my new look!',
          text: 'I used facestyle.fun to edit this photo. Try it out!',
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
        alert('Could not share the image. Please try downloading it first.');
      }
    } else {
      alert('To share, please download the image first using the "Download Image" button.');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="px-6 py-2.5 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center text-sm tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500"
    >
      <ShareIcon />
      Share
    </button>
  );
};

export default ShareButtons;