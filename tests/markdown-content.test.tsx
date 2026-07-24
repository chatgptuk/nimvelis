import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MarkdownContent } from '../src/design/MarkdownContent';

afterEach(cleanup);

describe('MarkdownContent', () => {
  it('renders common assistant Markdown as semantic React elements', () => {
    render(
      <MarkdownContent
        text={[
          '## Release plan',
          '',
          '- Ship the **safe renderer**',
          '- Keep `raw text` copyable',
          '',
          '1. Test it',
          '2. Publish it',
          '',
          '> Local files stay local.',
          '',
          '```ts',
          'const ready = true;',
          '```',
          '',
          '[Nimvelis docs](https://example.com/docs)',
        ].join('\n')}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Release plan' })).toBeVisible();
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByText('safe renderer')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByText('raw text')).toHaveProperty('tagName', 'CODE');
    expect(screen.getByText('const ready = true;')).toHaveAttribute('data-language', 'ts');
    expect(screen.getByText('Local files stay local.').closest('blockquote')).not.toBeNull();

    const link = screen.getByRole('link', { name: 'Nimvelis docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('does not turn unsafe or relative link targets into navigation', () => {
    render(<MarkdownContent text="[Unsafe](javascript:alert(1)) and [Relative](/private-file)" />);

    const content = screen.getByLabelText('Markdown content');
    expect(within(content).queryByRole('link')).not.toBeInTheDocument();
    expect(content).toHaveTextContent('[Unsafe](javascript:alert(1))');
    expect(content).toHaveTextContent('[Relative](/private-file)');
  });

  it('renders an unfinished streamed code fence without losing its content', () => {
    render(<MarkdownContent text={'```js\nconsole.log("still streaming")'} />);

    expect(screen.getByText('console.log("still streaming")')).toHaveAttribute(
      'data-language',
      'js',
    );
  });
});
