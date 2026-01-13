import { Instagram, Linkedin } from 'lucide-react';

export function SocialLinks() {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
      <a 
        href="https://instagram.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="Instagram"
      >
        <Instagram size={24} />
      </a>
      <a 
        href="https://linkedin.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="LinkedIn"
      >
        <Linkedin size={24} />
      </a>
    </div>
  );
}
