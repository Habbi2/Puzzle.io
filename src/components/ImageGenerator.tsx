import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

interface ImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  theme?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface GenerationOptions {
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
}

// Styled components for improved UI with dark theme
const GeneratorContainer = styled.div`
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
`;

const Title = styled.h2`
  color: var(--color-accent-secondary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const SelectLabel = styled.label`
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
`;

const StyledSelect = styled.select`
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-bg-tertiary);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(92, 107, 192, 0.3);
  }
  
  option {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
`;

const GenerateButton = styled.button`
  width: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 500;
  margin-top: var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--color-accent-secondary);
  }
  
  &:disabled {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: var(--color-error);
  text-align: center;
`;

const ImagePreviewContainer = styled.div`
  margin-top: var(--spacing-lg);
  text-align: center;
`;

const ImagePreviewTitle = styled.h3`
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
`;

const StyledImage = styled.img`
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
`;

// Enhanced theme options with more variety
const THEMES = [
  'nature landscape', 'space exploration', 'underwater world', 'cityscape',
  'abstract art', 'fantasy creatures', 'jungle animals', 'steampunk world',
  'magical forest', 'desert oasis', 'winter wonderland', 'futuristic city',
  'castle kingdom', 'tropical beach', 'mountain adventure', 'haunted mansion'
];

// New artistic styles to apply to images
const STYLES = [
  'realistic', 'oil painting', 'watercolor', 'digital art',
  'anime style', 'cartoon', '3D rendering', 'pixel art', 
  'surrealism', 'impressionism', 'sketch', 'concept art'
];

// Special effects for more variety
const EFFECTS = [
  'none', 'sunset lighting', 'neon glow', 'dramatic shadows',
  'cinematic', 'foggy atmosphere', 'starry sky', 'rainy mood'
];

// Service options for image generation
const IMAGE_SERVICES = [
  { id: 'picsum', name: 'Lorem Picsum Photos' },
  { id: 'pixabay', name: 'Pixabay Images' },
  { id: 'robohash', name: 'Robohash (Fun Characters)' },
  { id: 'placeimg', name: 'Placeholder Images' }
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  onImageGenerated, 
  theme: initialTheme = 'nature landscape', 
  difficulty: initialDifficulty = 'medium' 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(initialTheme);
  const [style, setStyle] = useState<string>('digital art');
  const [effect, setEffect] = useState<string>('none');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialDifficulty);
  const [imageService, setImageService] = useState<string>('picsum');
  
  // We're not using the Hugging Face API since you don't have a key
  // But keeping this structure for future extensibility
  const API_KEY = process.env.REACT_APP_HUGGINGFACE_API_KEY;
  
  // Enhanced prompt generation with more detailed descriptions, including style and effects
  const generatePrompt = (theme: string, difficulty: string, style: string, effect: string): string => {
    // Base prompt combining theme, style, and effects
    let basePrompt = `${theme} ${style !== 'realistic' ? `in ${style} style` : ''} ${effect !== 'none' ? `with ${effect}` : ''}`;
    
    // Add detail level based on difficulty
    switch(difficulty) {
      case 'easy':
        return `${basePrompt}, simple composition, clear shapes, vibrant colors. High quality, 4k, detailed.`;
      case 'medium':
        return `${basePrompt}, balanced composition with moderate details. High quality, 4k, detailed.`;
      case 'hard':
        return `${basePrompt}, intricate details, complex patterns, rich textures. High quality, 4k, highly detailed.`;
      default:
        return basePrompt + `. High quality, 4k.`;
    }
  };
  
  // Use consistent image dimensions for all difficulty levels
  const getImageDimensions = (): { width: number, height: number } => {
    return { width: 1024, height: 1024 };
  };
  
  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Only try to use Hugging Face if API_KEY is defined
      if (API_KEY) {
        const prompt = generatePrompt(theme, difficulty, style, effect);
        const dimensions = getImageDimensions();
        
        const options: GenerationOptions = {
          prompt,
          negative_prompt: "blurry, distorted, text, watermark, signature, low quality, bad anatomy, out of frame, extra digits, fewer digits, cropped",
          ...dimensions
        };
        
        // Hugging Face Inference API implementation
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
          options,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
          }
        );
        
        // Convert the binary response to a base64 image URL
        const base64 = btoa(
          new Uint8Array(response.data)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const imageUrl = `data:image/jpeg;base64,${base64}`;
        
        setGeneratedImageUrl(imageUrl);
        onImageGenerated(imageUrl); // This will immediately use the image for the puzzle
      } else {
        // If no API key, use the alternative image source based on selected service
        generateStyledPlaceholderImage();
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Falling back to alternative service.');
      // Fall back to placeholder if API fails
      generateStyledPlaceholderImage();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enhanced placeholder images with styling applied based on user selections
  const generateStyledPlaceholderImage = () => {
    // Add a timestamp to prevent caching and force new image generation
    const timestamp = new Date().getTime();
    const randomId = Math.floor(Math.random() * 1000);
    
    // Maps themes to searchable keywords for different services
    const themeMap = {
      'nature landscape': 'nature,landscape',
      'space exploration': 'space,galaxy',
      'underwater world': 'underwater,ocean',
      'cityscape': 'city,architecture',
      'abstract art': 'abstract,art',
      'fantasy creatures': 'fantasy',
      'jungle animals': 'jungle,wildlife',
      'steampunk world': 'vintage,mechanical',
      'magical forest': 'forest,fog',
      'desert oasis': 'desert,oasis',
      'winter wonderland': 'winter,snow',
      'futuristic city': 'futuristic,technology',
      'castle kingdom': 'castle,medieval',
      'tropical beach': 'tropical,beach',
      'mountain adventure': 'mountain,adventure',
      'haunted mansion': 'dark,architecture'
    };
    
    // Get appropriate search terms for the theme
    const themeQuery = themeMap[theme as keyof typeof themeMap] || theme.replace(' ', ',');
    
    // Generate URL based on selected service and apply style effects when possible
    let imageUrl = '';
    
    switch(imageService) {
      case 'picsum': 
        // Lorem Picsum - add theme as a seed for some variety
        // Properly encode the seed parameter to avoid URL issues with spaces and special chars
        const picsumSeed = encodeURIComponent(`${style}-${themeQuery}-${randomId}`);
        imageUrl = `https://picsum.photos/seed/${picsumSeed}/1024/1024`;
        break;
        
      case 'pixabay':
        // For Pixabay-like images using Lorem Picsum with different parameters
        // Add theme and style to seed for better variety
        const pixabaySeed = encodeURIComponent(`${style}-${themeQuery}-${timestamp}`);
        imageUrl = `https://picsum.photos/seed/${pixabaySeed}/1024/1024`;
        break;
        
      case 'robohash':
        // RoboHash can create consistent robot/monster images based on text
        // We'll include theme, style, and effect in the seed for variety
        let roboType = 'set1'; // default robot style
        
        // Apply different robohash sets based on selected style
        if (style === 'pixel art') roboType = 'set2'; // monsters
        else if (style === 'cartoon') roboType = 'set3'; // robots
        else if (style === 'anime style') roboType = 'set4'; // cats
        else if (style === 'sketch') roboType = 'set5'; // humans
        
        // Use the theme, style, and effect in the seed for consistency
        const roboSeed = encodeURIComponent(`${theme}-${style}-${effect}-${randomId}`);
        imageUrl = `https://robohash.org/${roboSeed}?set=${roboType}&size=1024x1024`;
        break;
        
      case 'placeimg':
        // Placeholder with text describing the style and theme
        // Use placeholder.com for customized placeholder with style and theme text
        const placeholderText = `${style.toUpperCase()} ${theme.toUpperCase()}`;
        const bgColor = getColorForStyle(style);
        const textColor = getContrastingColor(bgColor);
        imageUrl = `https://placehold.co/1024x1024/${bgColor.slice(1)}/${textColor.slice(1)}?text=${encodeURIComponent(placeholderText)}`;
        break;
        
      default:
        // Default option with properly encoded URL parameters
        const defaultSeed = encodeURIComponent(`${themeQuery}-${randomId}`);
        imageUrl = `https://picsum.photos/seed/${defaultSeed}/1024/1024`;
    }
    
    console.log("Generated image URL:", imageUrl);
    setGeneratedImageUrl(imageUrl);
    onImageGenerated(imageUrl); // This will immediately use the image for the puzzle
  };
  
  // Helper function to get a background color based on selected style
  const getColorForStyle = (styleType: string): string => {
    switch(styleType) {
      case 'pixel art': return '#4ade80'; // Green for pixel art
      case 'cartoon': return '#60a5fa'; // Blue for cartoon
      case 'oil painting': return '#a78bfa'; // Purple for painting
      case 'watercolor': return '#38bdf8'; // Light blue for watercolor
      case 'digital art': return '#2563eb'; // Bright blue for digital
      case 'anime style': return '#fb7185'; // Pink for anime
      case 'surrealism': return '#8b5cf6'; // Purple for surrealism
      case 'impressionism': return '#f59e0b'; // Orange for impressionism
      case 'sketch': return '#94a3b8'; // Gray for sketch
      default: return '#3b82f6'; // Default blue
    }
  };
  
  // Helper function to get contrasting text color
  const getContrastingColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black or white based on brightness
    return brightness > 128 ? '#000000' : '#ffffff';
  };
  
  return (
    <GeneratorContainer>
      <Title>Create Amazing Puzzle Images</Title>
      
      <ControlsGrid>
        <ControlGroup>
          <SelectLabel htmlFor="theme-select">Theme:</SelectLabel>
          <StyledSelect 
            id="theme-select"
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            disabled={isLoading}
          >
            {THEMES.map(t => (
              <option key={t} value={t}>{t.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
            ))}
          </StyledSelect>
        </ControlGroup>
        
        <ControlGroup>
          <SelectLabel htmlFor="style-select">Art Style:</SelectLabel>
          <StyledSelect 
            id="style-select"
            value={style} 
            onChange={(e) => setStyle(e.target.value)}
            disabled={isLoading}
          >
            {STYLES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </StyledSelect>
        </ControlGroup>
        
        <ControlGroup>
          <SelectLabel htmlFor="effect-select">Special Effect:</SelectLabel>
          <StyledSelect 
            id="effect-select"
            value={effect} 
            onChange={(e) => setEffect(e.target.value)}
            disabled={isLoading}
          >
            {EFFECTS.map(e => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </StyledSelect>
        </ControlGroup>
        
        <ControlGroup>
          <SelectLabel htmlFor="service-select">Image Service:</SelectLabel>
          <StyledSelect 
            id="service-select"
            value={imageService} 
            onChange={(e) => setImageService(e.target.value)}
            disabled={isLoading}
          >
            {IMAGE_SERVICES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </StyledSelect>
        </ControlGroup>
        
        <ControlGroup>
          <SelectLabel htmlFor="difficulty-select">Puzzle Difficulty:</SelectLabel>
          <StyledSelect 
            id="difficulty-select"
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            disabled={isLoading}
          >
            <option value="easy">Easy (4x4)</option>
            <option value="medium">Medium (6x6)</option>
            <option value="hard">Hard (8x8)</option>
          </StyledSelect>
        </ControlGroup>
      </ControlsGrid>
      
      <GenerateButton 
        onClick={generateImage}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Masterpiece...' : 'Generate Awesome Puzzle Image'}
      </GenerateButton>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {generatedImageUrl && (
        <ImagePreviewContainer>
          <ImagePreviewTitle>Your New Puzzle Image:</ImagePreviewTitle>
          <StyledImage 
            src={generatedImageUrl} 
            alt="Generated puzzle image" 
          />
        </ImagePreviewContainer>
      )}
    </GeneratorContainer>
  );
};

export default ImageGenerator;