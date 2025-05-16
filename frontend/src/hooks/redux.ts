import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';

// 使用自定义的 useDispatch 和 useSelector hooks 替代普通的 useDispatch 和 useSelector
// 这样可以在整个应用中获得正确的 TypeScript 类型

// 导出类型安全的dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 导出类型安全的selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 