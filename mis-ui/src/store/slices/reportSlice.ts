import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type ReportState = {
  selectedReportId: string | null;
};

const initialState: ReportState = {
  selectedReportId: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    selectReport(state, action: PayloadAction<string | null>) {
      state.selectedReportId = action.payload;
    },
  },
});

export const { selectReport } = reportSlice.actions;

export default reportSlice.reducer;
