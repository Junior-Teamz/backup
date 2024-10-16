import PropTypes from 'prop-types';
import { useState, useRef, useCallback } from 'react';
// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Iconify from 'src/components/iconify';
//
import FileManagerPanel from './FileManagerPanel';
import FileManagerFileItem from './FileManagerFileItem';
import FileManagerFolderItem from './FileManagerFolderItem';
import FileManagerActionSelected from './FileManagerActionSelected';
import FileManagerShareDialog from './FileManagerShareDialog';
import FileManagerNewFolderDialog from './FileManagerNewFolderDialog';
import FileManagerNewFileDialog from './FileManagerNewFileDialog';
import { Link } from 'react-router-dom';

// ----------------------------------------------------------------------

export default function FileManagerGridView({
  table,
  data,
  dataFiltered,
  onDeleteItem,
  onRefetch,
  onOpenConfirm,
}) {
  const { selected, onSelectRow: onSelectItem, onSelectAllRows: onSelectAllItems } = table;

  const containerRef = useRef(null);

  const [folderName, setFolderName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const share = useBoolean();
  const newFolder = useBoolean();
  const upload = useBoolean();
  const files = useBoolean();
  const folders = useBoolean();

  const handleChangeInvite = useCallback((event) => {
    setInviteEmail(event.target.value);
  }, []);

  const handleChangeFolderName = useCallback((event) => {
    setFolderName(event.target.value);
  }, []);

  const [selectedTags, setSelectedTags] = useState([]);

  const handleTagChange = useCallback((tags) => {
    setSelectedTags(tags); // Update the selected tags state
    console.log('Selected Tags:', tags);
  }, []); // Added useCallback for stable function reference

  return (
    <>
      <Box ref={containerRef}>
        <FileManagerPanel
          title="Folders"
          subTitle={`${data.filter((item) => item.type === 'folder').length} folders`}
          onOpen={newFolder.onTrue}
          collapse={folders.value}
          onCollapse={folders.onToggle}
        />

        <Collapse in={!folders.value} unmountOnExit>
          <Box
            gap={3}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
          >
            {dataFiltered
              .filter((i) => i.type === 'folder')
              .map((folder, idx) => (
                <Link to={`folder/${folder.folder_id}`}>
                  <FileManagerFolderItem
                    key={idx}
                    folder={folder}
                    selected={selected.includes(folder.id)}
                    onSelect={() => onSelectItem(folder.id)}
                    onDelete={() => onDeleteItem(folder.id)}
                    sx={{ maxWidth: 'auto' }}
                  />
                </Link>
              ))}
          </Box>
        </Collapse>

        <Divider sx={{ my: 5, borderStyle: 'dashed' }} />

        <FileManagerPanel
          title="Files"
          subTitle={`${data.filter((item) => item.type !== 'folder').length} files`}
          onOpen={upload.onTrue}
          collapse={files.value}
          onCollapse={files.onToggle}
        />

        <Collapse in={!files.value} unmountOnExit>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
            gap={3}
          >
            {dataFiltered
              .filter((i) => i.type !== 'folder')
              .map((file) => (
                <FileManagerFileItem
                  key={file.id}
                  file={file}
                  selected={selected.includes(file.id)}
                  onSelect={() => onSelectItem(file.id)}
                  onDelete={() => onDeleteItem(file.id)}
                  sx={{ maxWidth: 'auto' }}
                />
              ))}
          </Box>
        </Collapse>

        {!!selected?.length && (
          <FileManagerActionSelected
            numSelected={selected.length}
            rowCount={data.length}
            selected={selected}
            onSelectAllItems={(checked) =>
              onSelectAllItems(
                checked,
                data.map((row) => row.id)
              )
            }
            action={
              <>
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={onOpenConfirm}
                  sx={{ mr: 1 }}
                >
                  Delete
                </Button>

                <Button
                  color="primary"
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="solar:share-bold" />}
                  onClick={share.onTrue}
                >
                  Share
                </Button>
              </>
            }
          />
        )}
      </Box>

      <FileManagerShareDialog
        open={share.value}
        inviteEmail={inviteEmail}
        onChangeInvite={handleChangeInvite}
        onClose={() => {
          share.onFalse();
          setInviteEmail(''); // Clear invite email on close
        }}
      />

      <FileManagerNewFileDialog
        onTagChange={handleTagChange}
        open={upload.value}
        onClose={upload.onFalse}
      />

      <FileManagerNewFolderDialog
        open={newFolder.value}
        onClose={newFolder.onFalse}
        title="New Folder"
        onTagChange={handleTagChange}
        onCreate={() => {
          newFolder.onFalse();
          setFolderName(''); // Clear folder name after creation
          console.info('CREATE NEW FOLDER', folderName);
        }}
        folderName={folderName}
        onChangeFolderName={handleChangeFolderName}
      />
    </>
  );
}

FileManagerGridView.propTypes = {
  data: PropTypes.array.isRequired,
  onRefetch: PropTypes.func,
  dataFiltered: PropTypes.array.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onOpenConfirm: PropTypes.func.isRequired,
  table: PropTypes.object.isRequired,
};
