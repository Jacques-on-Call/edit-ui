import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { debounce } from 'lodash';

export function useAutosave(blueprint, setBlueprint, sha) {
  const location = useLocation();
  const filePath = new URLSearchParams(location.search).get('path');
  const repo = localStorage.getItem('selectedRepo');
  const draftKey = `draft_${repo}_${filePath}_${sha}`;

  const saveDraft = useRef(debounce((bp) => {
    if (bp) {
      localStorage.setItem(draftKey, JSON.stringify(bp));
    }
  }, 1000)).current;

  useEffect(() => {
    if (blueprint) {
      saveDraft(blueprint);
    }
  }, [blueprint, saveDraft]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      if (window.confirm('An unsaved draft was found. Would you like to restore it?')) {
        setBlueprint(JSON.parse(savedDraft));
      } else {
        localStorage.removeItem(draftKey);
      }
    }
  }, [draftKey, setBlueprint]);
}
