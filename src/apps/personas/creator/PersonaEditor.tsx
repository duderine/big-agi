import * as React from 'react';
import {
  Box, Button, Card, CardContent, Chip, Divider, FormControl, FormLabel, Grid,
  IconButton, Input, Stack, Switch, Textarea, Typography
} from '@mui/joy';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useLLMSelect, useLLMSelectLocalState } from '~/common/components/forms/useLLMSelect';
import { useToggleableBoolean } from '~/common/util/hooks/useToggleableBoolean';
import type { SimplePersona, SimplePersonaProvenance } from '../store-app-personas';
import { addPersona, updatePersona } from '../store-app-personas';


interface PersonaEditorProps {
  initialPersona?: SimplePersona | null;
  onClose: () => void;
  onSave?: (persona: SimplePersona) => void;
}

const DEFAULT_CATEGORIES = ['General', 'Creative', 'Technical', 'Business', 'Fun', 'Custom'];

export function PersonaEditor({ initialPersona, onClose, onSave }: PersonaEditorProps) {
  const isEditing = !!initialPersona;
  
  // Form state
  const [name, setName] = React.useState(initialPersona?.name || '');
  const [description, setDescription] = React.useState(initialPersona?.description || '');
  const [systemPrompt, setSystemPrompt] = React.useState(initialPersona?.systemPrompt || '');
  const [category, setCategory] = React.useState(initialPersona?.category || 'General');
  const [pictureUrl, setPictureUrl] = React.useState(initialPersona?.pictureUrl || '');
  const [isFavorite, setIsFavorite] = React.useState(initialPersona?.isFavorite || false);
  const [customCategory, setCustomCategory] = React.useState('');
  const [showCustomCategory, setShowCustomCategory] = React.useState(false);
  
  // LLM selection
  const [personaLlmId, setPersonaLlmId] = useLLMSelectLocalState(true);
  const [personaLlm, llmComponent] = useLLMSelect(
    initialPersona?.llmId || personaLlmId, 
    (id) => {
      setPersonaLlmId(id);
    }, 
    { label: 'Default Model for this Persona', larger: true }
  );

  // Advanced parameters toggle
  const advanced = useToggleableBoolean(false);
  
  // Validation
  const isValid = name.trim() && systemPrompt.trim();
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle save
  const handleSave = () => {
    if (!isValid) return;
    
    const finalCategory = showCustomCategory && customCategory ? customCategory : category;
    
    const personaData: Omit<SimplePersona, 'id' | 'creationDate'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      systemPrompt: systemPrompt.trim(),
      category: finalCategory,
      pictureUrl: pictureUrl || undefined,
      isFavorite,
      llmId: personaLlm?.id,
      llmParameters: undefined, // Can be extended later
      usageCount: initialPersona?.usageCount || 0,
    };
    
    if (isEditing && initialPersona) {
      updatePersona(initialPersona.id, personaData);
      onSave?.({ ...initialPersona, ...personaData });
    } else {
      const newPersona = addPersona(personaData);
      onSave?.(newPersona);
    }
    
    onClose();
  };
  
  return (
    <Card sx={{ maxWidth: 800, width: '100%', mx: 'auto' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography level="title-lg">
            {isEditing ? 'Edit Persona' : 'Create New Persona'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              variant={isFavorite ? 'solid' : 'outlined'} 
              color={isFavorite ? 'danger' : 'neutral'}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <IconButton variant="soft" color="neutral" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {/* Left column - Image and basic info */}
          <Grid xs={12} md={4}>
            <Stack spacing={2}>
              {/* Image upload */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 'md',
                  border: '2px dashed',
                  borderColor: pictureUrl ? 'primary.softColor' : 'neutral.outlinedBorder',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  bgcolor: pictureUrl ? 'primary.softBg' : 'background.surface',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.softHoverColor',
                  },
                }}
                component="label"
              >
                {pictureUrl ? (
                  <Box
                    component="img"
                    src={pictureUrl}
                    alt="Persona"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'neutral.400', mb: 1 }} />
                    <Typography level="body-sm" color="neutral">
                      Add Photo
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </Box>
              
              {pictureUrl && (
                <Button
                  size="sm"
                  variant="soft"
                  color="neutral"
                  startDecorator={<DeleteIcon />}
                  onClick={() => setPictureUrl('')}
                >
                  Remove Photo
                </Button>
              )}
            </Stack>
          </Grid>
          
          {/* Right column - Form fields */}
          <Grid xs={12} md={8}>
            <Stack spacing={2}>
              {/* Name */}
              <FormControl required>
                <FormLabel>Persona Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Creative Writer, Code Reviewer, etc."
                  size="lg"
                />
              </FormControl>
              
              {/* Description */}
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this persona..."
                />
              </FormControl>
              
              {/* Category */}
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <Chip
                      key={cat}
                      variant={category === cat && !showCustomCategory ? 'solid' : 'outlined'}
                      color={category === cat && !showCustomCategory ? 'primary' : 'neutral'}
                      onClick={() => {
                        setCategory(cat);
                        setShowCustomCategory(false);
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      {cat}
                    </Chip>
                  ))}
                  <Chip
                    variant={showCustomCategory ? 'solid' : 'outlined'}
                    color={showCustomCategory ? 'primary' : 'neutral'}
                    onClick={() => setShowCustomCategory(true)}
                    sx={{ cursor: 'pointer' }}
                  >
                    + Custom
                  </Chip>
                </Box>
                {showCustomCategory && (
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category..."
                    size="sm"
                  />
                )}
              </FormControl>
              
              {/* LLM Selection */}
              <FormControl>
                <FormLabel>Default Model</FormLabel>
                {llmComponent}
              </FormControl>
            </Stack>
          </Grid>
          
          {/* Full width - System Prompt */}
          <Grid xs={12}>
            <Divider sx={{ my: 2 }} />
            <FormControl required>
              <FormLabel>System Prompt</FormLabel>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter the system prompt that defines this persona's behavior, knowledge, and personality..."
                minRows={6}
                maxRows={12}
                sx={{ fontFamily: 'monospace', fontSize: 'sm' }}
              />
            </FormControl>
          </Grid>
          
          {/* Advanced options */}
          <Grid xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Switch
                checked={advanced.on}
                onChange={advanced.toggle}
                size="sm"
              />
              <Typography level="body-sm" onClick={advanced.toggle} sx={{ cursor: 'pointer' }}>
                Show Advanced Options
              </Typography>
            </Box>
            
            {advanced.on && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.level1', borderRadius: 'md' }}>
                <Typography level="body-sm" color="neutral">
                  Advanced parameters (temperature, top_p, etc.) can be configured here in future updates.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
        
        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" color="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<SaveIcon />}
            onClick={handleSave}
            disabled={!isValid}
          >
            {isEditing ? 'Update Persona' : 'Create Persona'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
