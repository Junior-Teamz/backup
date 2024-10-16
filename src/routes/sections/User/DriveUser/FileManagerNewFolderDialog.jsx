import PropTypes from 'prop-types';
import { useEffect, useState, useCallback } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
// components
import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';
import { enqueueSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useIndexTag } from './view/TagUser/useIndexTag';
import { useMutationFolder } from './view/FetchFolderUser';
import { useQueryClient } from '@tanstack/react-query';

// ----------------------------------------------------------------------

export default function FileManagerNewFolderDialog({
  title,
  open,
  onClose,
  onCreate,
  onUpdate,
  folderName,
  onChangeFolderName,
  onTagChange,
  refetch = () => {}, // Provide a fallback function
  ...other
}) {
  const [files, setFiles] = useState([]);
  const { register, handleSubmit, reset, setValue, getValues } = useForm();
  const { data, isLoading: isLoadingTags } = useIndexTag();
  const tagsData = data?.data || [];
  const [selectedTags, setSelectedTags] = useState([]);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (open) {
      reset(); // Reset form when dialog is opened
      setFiles([]); // Clear files on dialog open
      setSelectedTags([]); // Reset selected tags on dialog open
      setValue('name', ''); // Ensure the folder name is also reset
    }
  }, [open, reset, setValue]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      if (acceptedFiles.length && !getValues('name')) {
        const folderName = acceptedFiles[0].webkitRelativePath
          ? acceptedFiles[0].webkitRelativePath.split('/')[0]
          : acceptedFiles[0].name;
        setValue('name', folderName); // Set the folder name
      }

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    },
    [getValues, setValue]
  );

  const { mutate: CreateFolder, isPending: loadingUpload } = useMutationFolder({
    onSuccess: () => {
      enqueueSnackbar('Folder Created Successfully');
      handleRemoveAllFiles();
      reset(); // Reset form after successful upload
      queryClient.invalidateQueries({ queryKey: ['fetch.folder'] });
      onClose(); // Close dialog after successful upload
    },
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error' });
    },
  });

  const handleCreate = () => {
    const nameValue = getValues('name');
    if (!nameValue || !selectedTags.length) {
      enqueueSnackbar('Please fill in the required fields: name and tags', { variant: 'warning' });
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file[]', file);
    });

    selectedTags.forEach((tagId) => {
      formData.append('tag_ids[]', tagId);
    });

    formData.append('name', nameValue);

    CreateFolder(formData);
  };

  const handleRemoveFile = (inputFile) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== inputFile));
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  const handleTagChange = (event) => {
    const value = event.target.value;
    setSelectedTags(value);
    if (typeof onTagChange === 'function') {
      onTagChange(value);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} {...other}>
      <DialogTitle sx={{ p: (theme) => theme.spacing(3, 3, 2, 3) }}>{title}</DialogTitle>

      <DialogContent dividers sx={{ pt: 1, pb: 0, border: 'none' }}>
        <TextField fullWidth label="Name" {...register('name')} required sx={{ mb: 3 }} />
        <FormControl fullWidth margin="dense">
          <InputLabel id="tags-label">Tags</InputLabel>
          <Select
            labelId="tags-label"
            id="tags"
            multiple
            value={selectedTags}
            onChange={handleTagChange}
            input={<OutlinedInput id="select-multiple-chip" label="Tags" />}
            renderValue={(selected) => (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  maxHeight: 100,
                  overflowY: 'auto',
                }}
              >
                {selected.map((tagId) => {
                  const tag = tagsData.find((t) => t.id === tagId);
                  return (
                    <Chip
                      key={tagId}
                      label={tag ? tag.name : `Tag ${tagId} not found`}
                      sx={{ mb: 0.5 }}
                    />
                  );
                })}
              </Box>
            )}
          >
            {isLoadingTags ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : tagsData.length > 0 ? (
              tagsData.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {tag.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No tags available</MenuItem>
            )}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Iconify icon="eva:cloud-upload-fill" />}
          onClick={handleCreate}
        >
          {loadingUpload ? 'Loading...' : 'Create Folder'}
        </Button>

        {!!files.length && (
          <Button variant="outlined" color="inherit" onClick={handleRemoveAllFiles}>
            Remove all
          </Button>
        )}
        {/* {(onCreate || onUpdate) && (
          <Stack direction="row" justifyContent="flex-end" flexGrow={1}>
            <Button variant="soft" onClick={onCreate || onUpdate}>
              {onUpdate ? 'Save' : 'Create'}
            </Button>
          </Stack>
        )} */}
      </DialogActions>
    </Dialog>
  );
}

FileManagerNewFolderDialog.propTypes = {
  folderName: PropTypes.string,
  onChangeFolderName: PropTypes.func,
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.string,
  refetch: PropTypes.func,
  onTagChange: PropTypes.func.isRequired,
  tagsData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  selectedTags: PropTypes.arrayOf(PropTypes.string),
  isLoadingTags: PropTypes.bool,
};
