import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Popper,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
} from "@mui/material";
import { searchUsers } from "../../api/users";

export default function CommentComposer({ onSubmit, disabled }) {
  const [content, setContent] = React.useState("");
  const [mentions, setMentions] = React.useState([]); // [{id,name,title,avatarUrl}]
  const [mentionOpen, setMentionOpen] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const inputRef = React.useRef(null);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const findAtTrigger = (txt) => {
    const m = txt.match(/(^|\s)@([A-Za-z0-9\u0590-\u05FF._'-]{1,30})$/u);
    if (!m) return null;
    return { start: m.index + m[1].length, query: m[2] };
  };

  React.useEffect(() => {
    let t;
    if (mentionOpen && mentionQuery.trim()) {
      t = setTimeout(async () => {
        const res = await searchUsers(mentionQuery, 8).catch(() => []);
        setOptions(Array.isArray(res) ? res : []);
      }, 200);
    } else {
      setOptions([]);
    }
    return () => clearTimeout(t);
  }, [mentionOpen, mentionQuery]);

  const onChange = (e) => {
    const val = e.target.value;
    setContent(val);
    const tr = findAtTrigger(val);
    if (tr) {
      setMentionQuery(tr.query);
      setMentionOpen(true);
      setAnchorEl(inputRef.current);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  };

  const insertMention = (opt) => {
    const tr = findAtTrigger(content);
    if (!tr) return;
    const before = content.slice(0, tr.start);
    const after = content.slice(tr.start + 1 + tr.query.length);
    const next = `${before}@${opt.name} ${after}`;
    setContent(next);
    setMentions((prev) =>
      prev.some((m) => m.id === opt.id) ? prev : [...prev, opt]
    );
    setMentionOpen(false);
    setMentionQuery("");
  };

  const handlePost = () => {
    const ids = mentions.map((m) => m.id);
    if (!content.trim()) return;
    onSubmit?.({ content: content.trim(), mentions: ids });
    setContent("");
    setMentions([]);
    setMentionOpen(false);
    setMentionQuery("");
  };

  return (
    <Stack spacing={1.25}>
      <TextField
        inputRef={inputRef}
        multiline
        minRows={2}
        placeholder="Write a comment… Use @ to mention"
        value={content}
        onChange={onChange}
        disabled={disabled}
      />
      <Popper
        open={mentionOpen && options.length > 0}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <Paper
          elevation={3}
          sx={{ mt: 1, minWidth: 280, maxHeight: 280, overflowY: "auto" }}
        >
          <List dense>
            {options.map((opt) => (
              <ListItemButton key={opt.id} onClick={() => insertMention(opt)}>
                <ListItemAvatar>
                  <Avatar src={opt.avatarUrl}>{(opt.name || "U")[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={opt.name}
                  secondary={opt.title || null}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>

      {mentions.length ? (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {mentions.map((m) => (
            <Chip
              key={m.id}
              avatar={<Avatar src={m.avatarUrl}>{(m.name || "U")[0]}</Avatar>}
              label={m.name}
              size="small"
              onDelete={() =>
                setMentions((prev) => prev.filter((x) => x.id !== m.id))
              }
            />
          ))}
        </Box>
      ) : null}

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          size="small"
          onClick={handlePost}
          disabled={disabled}
        >
          Post
        </Button>
      </Box>
    </Stack>
  );
}
