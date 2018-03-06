import { IGridAddress, IGridCopyEvent, IGridPasteEvent } from '../components';
import { HeadersContainer, IHeader } from '../models';

export interface ICopyPasteRenderCellEvent {
    cell: IGridAddress;
    source: any;
    headers: HeadersContainer;
}

export interface ICopyPasteRenderHeaderEvent {
    header: IHeader;
}

export interface ICopyPasteResultEvent {
    table: any[][];
    focus: () => void;
}

export interface ICopyPasteParseEvent extends IGridAddress {
    value: string;
}

export interface ICopyPasteUpdateEvent {
    changes: (IGridAddress & { value: any })[];
}

export interface ICopyPasteControllerProps {
    onInvalidSelection?: () => void;
    renderCell: (e: ICopyPasteRenderCellEvent) => string;
    renderHeader: (e: ICopyPasteRenderHeaderEvent) => string;
    clipboardParser: (data: DataTransfer) => string[][];
    cellParser: (e: ICopyPasteParseEvent) => any;
    onCopy: (e: ICopyPasteResultEvent) => void;
    onPaste: (e: ICopyPasteUpdateEvent) => void;
}

export class ClipboardController {
    constructor(public props: ICopyPasteControllerProps) { }

    private _getValidatedTable(cells: IGridAddress[]) {
        let table: IGridAddress[][] = [];

        cells.forEach((cell) => {
            if (!table[cell.row]) {
                table[cell.row] = [];
            }

            table[cell.row][cell.column] = cell;
        });

        let first: IGridAddress[] = null;
        let firstLen = -1;

        let validated = table.every((r) => {
            if (!first) {
                firstLen = (first = r).filter(v => !!v).length;
                return true;
            }

            return firstLen === r.filter(v => !!v).length && first.every((c, j) => r[j] && r[j].column === c.column);
        });

        if (!validated) {
            return null;
        }

        return table.filter(v => !!v).map(r => r.filter(c => !!c));
    }

    private _renderHeader(header: IHeader, lock: { [headerId: string]: boolean }) {
        if (lock[header.$id]) {
            return '';
        }

        lock[header.$id] = true;
        return this.props.renderHeader({ header });
    }

    private _transpose(table: any[][]) {
        let out: any[][] = [];

        for (let r = 0, rLen = table.length; r < rLen; r++) {
            for (let c = 0, cLen = table[r].length; c < cLen; c++) {
                (out[c] = out[c] || [])[r] = table[r][c];
            }
        }

        return out;
    }

    public onCopy = ({ cells, headers, source, withHeaders, focus }: IGridCopyEvent) => {
        let table = this._getValidatedTable(cells);

        if (!table) {
            if (this.props.onInvalidSelection) {
                this.props.onInvalidSelection();
            }

            return;
        }

        let out = table.map(r => r.map(c => this.props.renderCell({ source, headers, cell: c })));

        if (withHeaders) {
            let lock: { [headerId: string]: boolean } = {};
            let top: string[][] = [];
            let left: string[][] = [];
            let columnLine = table[0];
            let rowLine = table.map(r => r[0]);
            let columnLen = columnLine.length;
            let rowLen = rowLine.length;

            // render column headers
            columnLine.forEach(({ column }, c) => {
                let h = headers.columns[column];
                let level = headers.getLevel(h);

                do {
                    top[level] = top[level] || new Array(columnLen).fill('');
                    top[level][c] = this._renderHeader(h, lock);
                } while (level-- , h = headers.getParent(h));
            });

            // render row headers
            rowLine.forEach(({ row }, r) => {
                let h = headers.rows[row];
                let level = headers.getLevel(h);

                do {
                    left[level] = left[level] || new Array(rowLen).fill('');
                    left[level][r] = this._renderHeader(h, lock);
                } while (level-- , h = headers.getParent(h));
            });

            // insert padding for top headers
            let paddingLeft = left.length;
            left = this._transpose(left);
            top = top.map((line) => [...(new Array(paddingLeft).fill('')), ...line]);

            // insert left headers
            out = out.map((line, r) => [...left[r], ...line]);

            out = [...top, ...out];
        }

        this.props.onCopy({ table: out, focus });
    }

    public onPaste = ({ clipboard, target }: IGridPasteEvent) => {
        let table = this.props.clipboardParser(clipboard);

        if (!Array.isArray(table) || !table.length || !Array.isArray(table[0]) || !table[0].length) {
            return;
        }

        let changes: (IGridAddress & { value: any })[] = [];

        for (let r = 0, rLen = table.length; r < rLen; r++) {
            for (let c = 0, cLen = table[r].length; c < cLen; c++) {
                changes.push({
                    column: target.column + c,
                    row: target.row + r,
                    value: this.props.cellParser({
                        column: target.column + c,
                        row: target.row + r,
                        value: table[r][c]
                    })
                });
            }
        }

        this.props.onPaste({ changes });
    }
}