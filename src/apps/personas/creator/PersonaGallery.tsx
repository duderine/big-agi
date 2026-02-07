import * as React from 'react';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, Stack, Typography
} from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';

import { GoodTooltip } from '~/common/components/GoodTooltip';
import type { SimplePersona } from '../store-app-personas';
import { useSimplePersonas, toggleFavoritePersona, deleteSimplePersona } from '../store-app-personas';


interface PersonaGalleryProps {
  onCreateNew: () => void;
  onEdit: (persona: SimplePersona) => void;
  onSelect?: (persona: SimplePersona) => void;
}

export function PersonaGallery({ onCreateNew, onEdit, onSelect }: PersonaGalleryProps) {
  const { simplePersonas, favorites, regular } = useSimplePersonas();
  
  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavoritePersona(id);
  };
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this persona?')) {
      deleteSimplePersona(id);
    }
  };
  
  const PersonaCard = ({ persona }: { persona: SimplePersona }) => (
    <Card
      variant="outlined"
      sx={{
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 'md',
          borderColor: 'primary.softColor',
        },
      }}
      onClick={() => onSelect?.(persona)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: 'primary.softBg',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {persona.pictureUrl ? (
              <Box
                component="img"
                src={persona.pictureUrl}
                alt={persona.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PersonIcon sx={{ fontSize: 32, color: 'primary.softColor' }} />
            )}
          </Box>
          
          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography level="title-md" sx={{ mb: 0.5 }}>
                {persona.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  size="sm"
                  variant={persona.isFavorite ? 'solid' : 'plain'}
                  color={persona.isFavorite ? 'danger' : 'neutral'}
                  onClick={(e) => handleToggleFavorite(e, persona.id)}
                >
                  {persona.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(persona);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={(e) => handleDelete(e, persona.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
            
            {persona.description && (
              <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>
                {persona.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {persona.category && (
                <Chip size="sm" variant="soft" color="primary">
                  {persona.category}
                </Chip>
              )}
              {persona.llmLabel && (
                <Chip size="sm" variant="outlined" color="neutral">
                  {persona.llmLabel}
                </Chip>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography level="title-lg">
          My Personas
          {simplePersonas.length > 0 && (
            <Chip size="sm" sx={{ ml: 1 }}>
              {simplePersonas.length}
            </Chip>
          )}
        </Typography>
        <Button
          startDecorator={<AddIcon />}
          onClick={onCreateNew}
          size="sm"
        >
          Create Persona
        </Button>
      </Box>
      
      {simplePersonas.length === 0 ? (
        <Card variant="soft" sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <PersonIcon sx={{ fontSize: 64, color: 'neutral.300', mb: 2 }} />
            <Typography level="title-md" sx={{ mb: 1 }}>
              No personas yet
            </Typography>
            <Typography level="body-sm" color="neutral" sx={{ mb: 3 }}>
              Create your first custom persona to get started
            </Typography>
            <Button startDecorator={<AddIcon />} onClick={onCreateNew}>
              Create Your First Persona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Favorites section */}
          {favorites.length > 0 && (
            <Box>
              <Typography level="title-sm" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FavoriteIcon color="danger" fontSize="small" />
                Favorites
              </Typography>
              <Grid container spacing={2}>
                {favorites.map((persona) => (
                  <Grid xs={12} md={6} key={persona.id}>
                    <PersonaCard persona={persona} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* All personas section */}
          <Box>
            <Typography level="title-sm" sx={{ mb: 2 }}>
              All Personas
            </Typography>
            <Grid container spacing={2}>
              {regular.map((persona) => (
                <Grid xs={12} md={6} key={persona.id}>
                  <PersonaCard persona={persona} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
