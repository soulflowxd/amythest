using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace Amythest.Windows
{
    internal static class Palette
    {
        public static readonly Color Background = Color.FromArgb(5, 5, 6);
        public static readonly Color Card = Color.FromArgb(20, 20, 23);
        public static readonly Color Ink = Color.FromArgb(246, 243, 252);
        public static readonly Color Muted = Color.FromArgb(174, 168, 186);
        public static readonly Color Lilac = Color.FromArgb(204, 177, 250);
        public static readonly Color Border = Color.FromArgb(40, 40, 44);
        public static readonly Color White = Color.FromArgb(28, 28, 32);
    }

    internal sealed class GlassStrip : Panel
    {
        public GlassStrip() { DoubleBuffered = true; BackColor = Palette.Background; }
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            e.Graphics.Clear(Palette.Background);
        }
    }

    internal sealed class LogoMark : Control
    {
        public LogoMark()
        {
            SetStyle(ControlStyles.SupportsTransparentBackColor | ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint, true);
            DoubleBuffered = true;
            Size = new Size(48, 48);
            BackColor = Color.Transparent;
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.ScaleTransform(Width / 128f, Height / 128f);
            using (GraphicsPath outer = new GraphicsPath())
            using (GraphicsPath center = new GraphicsPath())
            {
                outer.StartFigure();
                outer.AddBezier(66, 15, 85, 13, 99, 27, 109, 48);
                outer.AddBezier(109, 48, 118, 67, 118, 86, 105, 100);
                outer.AddBezier(105, 100, 91, 115, 67, 116, 46, 113);
                outer.AddBezier(46, 113, 27, 110, 14, 97, 12, 81);
                outer.AddBezier(12, 81, 9, 65, 24, 46, 37, 31);
                outer.AddBezier(37, 31, 47, 20, 56, 16, 66, 15);
                outer.CloseFigure();
                center.StartFigure();
                center.AddBezier(67, 37, 79, 35, 89, 44, 95, 58);
                center.AddBezier(95, 58, 99, 67, 105, 75, 101, 82);
                center.AddBezier(101, 82, 99, 88, 92, 92, 86, 95);
                center.AddBezier(86, 95, 78, 99, 70, 101, 63, 102);
                center.AddBezier(63, 102, 52, 103, 38, 96, 33, 90);
                center.AddBezier(33, 90, 28, 82, 32, 72, 41, 61);
                center.AddBezier(41, 61, 48, 51, 55, 38, 67, 37);
                center.CloseFigure();
                using (LinearGradientBrush opal = new LinearGradientBrush(new Rectangle(9, 11, 112, 109), Color.White, Color.FromArgb(170, 162, 206), LinearGradientMode.Vertical))
                    e.Graphics.FillPath(opal, outer);
                using (LinearGradientBrush amethyst = new LinearGradientBrush(new Rectangle(32, 36, 74, 70), Color.FromArgb(239, 211, 255), Color.FromArgb(80, 38, 154), LinearGradientMode.Vertical))
                    e.Graphics.FillPath(amethyst, center);
                using (Pen edge = new Pen(Color.FromArgb(176, 154, 206), 1.8f)) e.Graphics.DrawPath(edge, outer);
                using (Pen shine = new Pen(Color.FromArgb(190, 255, 255, 255), 3f))
                    e.Graphics.DrawBezier(shine, 25, 59, 33, 35, 53, 22, 64, 20);
            }
        }
    }

    internal sealed class AeroTabs : TabControl
    {
        public AeroTabs()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer, true);
            DrawMode = TabDrawMode.OwnerDrawFixed;
            BackColor = Palette.Background;
            SizeMode = TabSizeMode.Fixed;
            ItemSize = new Size(142, 34);
            Font = new Font("Segoe UI", 10, FontStyle.Bold);
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(Palette.Background);
            for (int index = 0; index < TabCount; index++) DrawTab(e.Graphics, index);
        }
        private void DrawTab(Graphics graphics, int index)
        {
            bool selected = index == SelectedIndex;
            Rectangle rect = GetTabRect(index);
            using (SolidBrush brush = new SolidBrush(Palette.Background)) graphics.FillRectangle(brush, rect);
            if (selected) using (Pen accent = new Pen(Palette.Lilac, 2)) graphics.DrawLine(accent, rect.Left + 28, rect.Bottom - 2, rect.Right - 28, rect.Bottom - 2);
            Color textColor = selected ? Palette.Ink : Palette.Muted;
            TextRenderer.DrawText(graphics, TabPages[index].Text, Font, rect, textColor, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }
    }

    internal sealed class AeroCard : Panel
    {
        public AeroCard() { DoubleBuffered = true; BackColor = Palette.Card; }
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            e.Graphics.Clear(Palette.Background);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(1, 1, Width - 3, Height - 3);
            if (rect.Width <= 0 || rect.Height <= 0) return;
            using (GraphicsPath path = Ui.RoundRect(rect, 22))
            using (SolidBrush brush = new SolidBrush(Palette.Card)) e.Graphics.FillPath(brush, path);

        }
    }

    internal sealed class AeroButton : Button
    {
        private bool hover;
        private bool pressed;
        public AeroButton()
        {
            FlatStyle = FlatStyle.Flat;
            FlatAppearance.BorderSize = 0;
            Cursor = Cursors.Hand;
            Font = new Font("Segoe UI", 10, FontStyle.Bold);
            ForeColor = Color.FromArgb(39, 27, 75);
        }
        protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
        protected override void OnMouseLeave(EventArgs e) { hover = false; pressed = false; Invalidate(); base.OnMouseLeave(e); }
        protected override void OnMouseDown(MouseEventArgs e) { pressed = true; Invalidate(); base.OnMouseDown(e); }
        protected override void OnMouseUp(MouseEventArgs e) { pressed = false; Invalidate(); base.OnMouseUp(e); }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(Parent == null ? Palette.Background : Parent.BackColor);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(1, 1, Width - 3, Height - 4);
            if (rect.Width <= 0 || rect.Height <= 0) return;
            bool primary = Text.StartsWith("Start") || Text.StartsWith("End") || Text.StartsWith("Take");
            Color face = !Enabled ? Color.FromArgb(72, 70, 77) : pressed ? Color.FromArgb(211, 205, 222) : hover ? Color.White : Color.FromArgb(242, 240, 247);
            using (GraphicsPath path = Ui.RoundRect(rect, 20))
            using (SolidBrush brush = new SolidBrush(primary ? face : hover ? Color.FromArgb(48, 47, 54) : Color.FromArgb(35, 35, 40))) e.Graphics.FillPath(brush, path);
            TextRenderer.DrawText(e.Graphics, Text, Font, rect, primary ? Color.FromArgb(24, 24, 28) : Palette.Ink, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
            if (Focused) ControlPaint.DrawFocusRectangle(e.Graphics, new Rectangle(6, 5, Width - 12, Height - 12));
        }
    }

    internal sealed class GoalBar : Control
    {
        private double fraction;
        public double Fraction { get { return fraction; } set { fraction = Math.Max(0, Math.Min(1, value)); Invalidate(); } }
        public GoalBar() { DoubleBuffered = true; Height = 12; }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (SolidBrush track = new SolidBrush(Palette.Border)) e.Graphics.FillRectangle(track, 0, 0, Width, Height);
            int fill = (int)(Width * fraction);
            if (fill > 0)
            {
                using (SolidBrush brush = new SolidBrush(Palette.Lilac))
                    e.Graphics.FillRectangle(brush, 0, 0, fill, Height);
            }
        }
    }

    internal sealed class HourChart : Control
    {
        private long[] hours = new long[24];
        public long[] Hours { set { hours = value == null || value.Length != 24 ? new long[24] : (long[])value.Clone(); Invalidate(); } }
        public HourChart() { DoubleBuffered = true; BackColor = Palette.Card; AccessibleName = "Hourly Windows activity chart"; }
        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            int chartTop = 7, chartBottom = Math.Max(8, Height - 22);
            using (Pen grid = new Pen(Color.FromArgb(62, 54, 72)))
            {
                e.Graphics.DrawLine(grid, 0, chartBottom, Width, chartBottom);
                e.Graphics.DrawLine(grid, 0, (chartTop + chartBottom) / 2, Width, (chartTop + chartBottom) / 2);
            }
            long maximum = Math.Max(60000, hours.Max());
            float slot = Width / 24f;
            for (int hour = 0; hour < 24; hour++)
            {
                int barHeight = (int)Math.Round((double)hours[hour] / maximum * (chartBottom - chartTop));
                if (barHeight > 0)
                {
                    Rectangle rect = new Rectangle((int)(hour * slot + slot * .19f), chartBottom - barHeight, Math.Max(2, (int)(slot * .62f)), barHeight);
                    using (SolidBrush brush = new SolidBrush(Palette.Lilac))
                        e.Graphics.FillRectangle(brush, rect);
                }
            }
            using (Font labelFont = new Font("Segoe UI", 8))
            {
                foreach (int hour in new[] { 0, 6, 12, 18 })
                    TextRenderer.DrawText(e.Graphics, hour == 0 ? "12a" : hour == 12 ? "12p" : (hour % 12) + (hour < 12 ? "a" : "p"), labelFont,
                        new Rectangle((int)(hour * slot), chartBottom + 2, 35, 17), Palette.Muted);
            }
        }
    }

    internal sealed class GeodeView : Control
    {
        private readonly Bitmap art;
        private int stage = 1;
        private int target = 1;
        private int next = 1;
        private float blend;
        private readonly System.Windows.Forms.Timer animation = new System.Windows.Forms.Timer { Interval = 33 };
        public int Stage { get { return target; } set {
            target = Math.Max(0, Math.Min(3, value));
            if (!SystemInformation.IsMenuAnimationEnabled) {
                animation.Stop(); stage = next = target; blend = 0; Invalidate(); return;
            }
            if (target == stage && !animation.Enabled) return;
            if (!animation.Enabled) { next = stage + Math.Sign(target - stage); blend = 0; animation.Start(); }
        } }
        public GeodeView()
        {
            DoubleBuffered = true;
            BackColor = Palette.Card;
            AccessibleName = "Amethyst geode showing today's distraction budget";
            string path = Path.Combine(Path.GetDirectoryName(typeof(GeodeView).Assembly.Location), "amythest-geode-stages.png");
            if (File.Exists(path)) { using (Bitmap loaded = new Bitmap(path)) art = new Bitmap(loaded); }
            animation.Tick += delegate {
                blend = Math.Min(1f, blend + .15f);
                if (blend >= 1f) {
                    stage = next;
                    blend = 0;
                    if (stage == target) animation.Stop();
                    else next = stage + Math.Sign(target - stage);
                }
                Invalidate();
            };
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(Parent == null ? Palette.Background : Parent.BackColor);
            if (art == null) return;
            e.Graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            int tileWidth = art.Width / 2, tileHeight = art.Height / 2;
            float scale = 1.0f * Math.Min((float)Width / tileWidth, (float)Height / tileHeight);
            int width = (int)(tileWidth * scale), height = (int)(tileHeight * scale);
            Rectangle destination = new Rectangle((Width - width) / 2, (Height - height) / 2, width, height);
            DrawStage(e.Graphics, destination, stage, 1f);
            if (animation.Enabled) DrawStage(e.Graphics, destination, next, blend);
        }
        private void DrawStage(Graphics graphics, Rectangle destination, int tile, float alpha)
        {
            int tileWidth = art.Width / 2, tileHeight = art.Height / 2;
            Rectangle source = new Rectangle((tile % 2) * tileWidth, (tile / 2) * tileHeight, tileWidth, tileHeight);
            using (ImageAttributes attributes = new ImageAttributes()) {
                ColorMatrix color = new ColorMatrix();
                color.Matrix33 = alpha;
                attributes.SetColorMatrix(color);
                graphics.DrawImage(art, destination, source.X, source.Y, source.Width, source.Height, GraphicsUnit.Pixel, attributes);
            }
        }
        protected override void Dispose(bool disposing) { if (disposing) { animation.Dispose(); if (art != null) art.Dispose(); } base.Dispose(disposing); }
    }

    internal sealed class BlockForm : Form
    {
        private readonly Label title;
        private readonly Label message;
        private readonly Button breakButton;
        public event EventHandler BreakRequested;
        public BlockForm()
        {
            Text = "Amythest reminder";
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            TopMost = true;
            BackColor = Palette.Background;
            StartPosition = FormStartPosition.Manual;
            WindowState = FormWindowState.Maximized;
            KeyPreview = true;
            AeroCard card = new AeroCard();
            card.Size = new Size(490, 320);
            Controls.Add(card);
            Resize += delegate { card.Left = (ClientSize.Width - card.Width) / 2; card.Top = (ClientSize.Height - card.Height) / 2; };
            title = Ui.Label("Pause for a moment.", 30, 44, 430, 48, 28, true);
            card.Controls.Add(Ui.Label("Amythest", 30, 20, 430, 20, 10, true, Palette.Ink));
            card.Controls.Add(title);
            message = Ui.Label("", 30, 106, 430, 72, 14, false, Palette.Muted);
            card.Controls.Add(message);
            breakButton = Ui.Button("Take a 5-minute break", 30, 220, 430, 48);
            breakButton.Click += delegate { if (BreakRequested != null) BreakRequested(this, EventArgs.Empty); };
            card.Controls.Add(breakButton);
            card.Controls.Add(Ui.Label("This is a self-control pause. You can switch to another app.", 30, 278, 430, 24, 10, false, Palette.Muted));
            Deactivate += delegate { Hide(); };
            KeyDown += delegate(object sender, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) Hide(); };
        }
        public void ShowFor(string app, string reason, bool hardMode = false)
        {
            title.Text = "Hold on, " + app + ".";
            message.Text = reason + (hardMode ? " Hard Mode is active until this focus session ends." : " Switch to something that supports what you want to do.");
            breakButton.Visible = !hardMode;
            if (!Visible) Show();
            BringToFront();
        }
    }

    internal static class Ui
    {
        public static GraphicsPath RoundRect(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int diameter = Math.Min(radius * 2, Math.Min(rect.Width, rect.Height));
            path.AddArc(rect.Left, rect.Top, diameter, diameter, 180, 90);
            path.AddArc(rect.Right - diameter, rect.Top, diameter, diameter, 270, 90);
            path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(rect.Left, rect.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }
        public static Label Label(string text, int x, int y, int w, int h, float size, bool bold, Color? color = null)
        {
            return new Label { Text = text, Left = x, Top = y, Width = w, Height = h,
                ForeColor = color ?? Palette.Ink, BackColor = Color.Transparent,
                Font = new Font("Segoe UI", size, bold ? FontStyle.Bold : FontStyle.Regular), TextAlign = ContentAlignment.MiddleLeft };
        }
        public static Button Button(string text, int x, int y, int w, int h)
        {
            return new AeroButton { Text = text, Left = x, Top = y, Width = w, Height = h };
        }
        public static TextBox Input(int x, int y, int w)
        {
            return new TextBox { Left = x, Top = y, Width = w, BorderStyle = BorderStyle.FixedSingle,
                BackColor = Palette.White, ForeColor = Palette.Ink, Font = new Font("Segoe UI", 11) };
        }
    }

    internal sealed class MainForm : Form
    {
        [DllImport("dwmapi.dll")] private static extern int DwmSetWindowAttribute(IntPtr handle, int attribute, ref int value, int size);
        private readonly LocalStore store;
        private readonly Settings settings;
        private Dictionary<string, long> usage;
        private long[] hours;
        private DateTime day;
        private DateTime lastTick;
        private int saveTicks;
        private int cloudTicks;
        private int cloudBusy;
        private readonly System.Windows.Forms.Timer timer;
        private readonly BlockForm blocker;
        private readonly NotifyIcon tray;
        private bool quitting;
        private Label totalLabel, distractionLabel, focusLabel, sessionClock, cloudLimitsEmpty;
        private GoalBar goalBar;
        private HourChart hourChart;
        private ListView usageList;
        private ListView websiteList;
        private ListView cloudDeviceList;
        private ListBox cloudSiteLimits;
        private CloudSiteSettings latestSiteSettings;
        private TextBox siteLimitDomain;
        private NumericUpDown siteLimitMinutes;
        private Label bridgeStatus;
        private Label accountStatus;
        private Label accountPageStatus;
        private Label geodeStatus;
        private GeodeView geodeView;
        private Button useCloudLimits;
        private CloudWindowsSettings pendingCloudLimits;
        private ListBox distractionList, limitList;
        private TextBox distractionInput, limitInput;
        private NumericUpDown goalInput, limitMinutes;
        private CheckBox workEnabled;
        private DateTimePicker workStart, workEnd;
        private Button focusButton;
        private CheckBox hardModeCheck;
        private ComboBox focusDuration;

        public MainForm() : this(null) { }

        public MainForm(string previewDataFolder)
        {
            store = new LocalStore(previewDataFolder ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Amythest"));
            settings = store.LoadSettings();
            day = DateTime.Today;
            usage = store.LoadUsage(day);
            hours = store.LoadHours(day);
            lastTick = DateTime.Now;
            Text = "Amythest — screen time for Windows";
            BackColor = Palette.Background;
            ForeColor = Palette.Ink;
            Font = new Font("Segoe UI", 10);
            FormBorderStyle = FormBorderStyle.Sizable;
            Size = new Size(1100, 800);
            MinimumSize = new Size(940, 700);
            StartPosition = FormStartPosition.CenterScreen;
            string iconPath = Path.Combine(Application.StartupPath, "icon48.png");
            if (File.Exists(iconPath))
            {
                try { using (Bitmap bitmap = new Bitmap(iconPath)) Icon = Icon.FromHandle(bitmap.GetHicon()); }
                catch { }
            }
            BuildUi();
            blocker = new BlockForm();
            blocker.BreakRequested += delegate { if (settings.HardModeUntil > DateTime.Now && settings.FocusUntil > DateTime.Now) return; settings.PausedUntil = DateTime.Now.AddMinutes(5); Save(); blocker.Hide(); RefreshSummary(); };
            tray = new NotifyIcon { Icon = Icon ?? SystemIcons.Application, Text = "Amythest screen time", Visible = true };
            ContextMenu menu = new ContextMenu();
            menu.MenuItems.Add("Open Amythest", delegate { Show(); WindowState = FormWindowState.Normal; Activate(); });
            menu.MenuItems.Add("Quit", delegate { if (settings.HardModeUntil > DateTime.Now && settings.FocusUntil > DateTime.Now) { MessageBox.Show("Hard Mode runs until " + settings.FocusUntil.ToString("h:mm tt") + ". Windows can still stop or uninstall this app.", "Amythest Hard Mode"); return; } quitting = true; Close(); });
            tray.ContextMenu = menu;
            tray.DoubleClick += delegate { Show(); WindowState = FormWindowState.Normal; Activate(); };
            FormClosing += delegate(object sender, FormClosingEventArgs e) { if (!quitting) { e.Cancel = true; Hide(); } };
            FormClosed += delegate { Save(); tray.Visible = false; tray.Dispose(); blocker.Dispose(); };
            timer = new System.Windows.Forms.Timer { Interval = 1000 };
            timer.Tick += Tick;
            if (previewDataFolder == null) timer.Start();
            RefreshAll();
            if (previewDataFolder == null) SyncCloud();
        }

        private void BuildUi()
        {
            Panel header = new Panel { BackColor = Palette.Background };
            Controls.Add(header);
            header.Controls.Add(new LogoMark { Left = 26, Top = 14, Width = 44, Height = 44 });
            header.Controls.Add(Ui.Label("amythest", 79, 14, 330, 32, 19, true, Color.White));


            Label edition = Ui.Label("Windows companion", 0, 25, 210, 20, 10, false, Palette.Muted);
            edition.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            header.Controls.Add(edition);
            header.Resize += delegate { edition.Left = header.ClientSize.Width - 235; };

            AeroCard summary = new AeroCard { Padding = new Padding(24) };
            Controls.Add(summary);
            summary.Controls.Add(Ui.Label("Screen time", 27, 17, 240, 27, 17, true, Palette.Ink));
            totalLabel = Ui.Label("0m", 27, 42, 210, 49, 31, true);
            summary.Controls.Add(totalLabel);
            summary.Controls.Add(Ui.Label("Total app time", 27, 99, 220, 24, 10, false, Palette.Muted));
            summary.Controls.Add(Ui.Label("Distraction budget", 296, 19, 220, 22, 12, false, Palette.Muted));
            distractionLabel = Ui.Label("0m / 2h", 296, 45, 330, 40, 23, true);
            summary.Controls.Add(distractionLabel);
            goalBar = new GoalBar { Left = 296, Top = 103, Width = 460, Anchor = AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Top };
            summary.Controls.Add(goalBar);

            GlassStrip footer = new GlassStrip();
            Controls.Add(footer);
            focusButton = Ui.Button("Start 25-minute focus", 24, 14, 270, 44);
            focusButton.Click += delegate { if (settings.FocusUntil > DateTime.Now && settings.HardModeUntil > DateTime.Now) return; settings.FocusUntil = settings.FocusUntil > DateTime.Now ? DateTime.MinValue : DateTime.Now.AddMinutes(settings.SessionMinutes); settings.HardModeUntil = settings.HardModeEnabled ? settings.FocusUntil : DateTime.MinValue; settings.PausedUntil = DateTime.MinValue; Save(); RefreshSummary(); };
            focusLabel = Ui.Label("No focus session running", 315, 19, 450, 36, 11, false, Color.FromArgb(236, 231, 252));
            footer.Controls.Add(Ui.Label("Amythest keeps your time in view.", 24, 7, 560, 25, 10, false, Color.FromArgb(236, 231, 252)));

            AeroTabs tabs = new AeroTabs();
            Controls.Add(tabs);
            Action layout = delegate {
                int width = ClientSize.Width;
                int height = ClientSize.Height;
                header.SetBounds(0, 0, width, 78);
                footer.Visible = false;
                tabs.SetBounds(28, 85, width - 56, Math.Max(150, height - 113));
            };
            Resize += delegate { layout(); };
            layout();
            TabPage todayPage = new TabPage("Home") { BackColor = Palette.Background, ForeColor = Palette.Ink, Padding = new Padding(20) };
            TabPage boundaryPage = new TabPage("Apps") { BackColor = Palette.Background, ForeColor = Palette.Ink };
            TabPage websitesPage = new TabPage("Websites") { BackColor = Palette.Background, ForeColor = Palette.Ink, Padding = new Padding(20) };
            TabPage accountPage = new TabPage("Account") { BackColor = Palette.Background, ForeColor = Palette.Ink, Padding = new Padding(20) };
            boundaryPage.AutoScroll = true;
            tabs.TabPages.Add(todayPage);
            tabs.TabPages.Add(boundaryPage);
            TabPage timerPage = new TabPage("Timer") { BackColor = Palette.Background, ForeColor = Palette.Ink };
            TabPage settingsPage = new TabPage("Settings") { BackColor = Palette.Background };
            tabs.TabPages.Add(timerPage);
            tabs.TabPages.Add(settingsPage);
            AeroTabs settingsTabs = new AeroTabs { Dock = DockStyle.Fill, Font = new Font("Segoe UI", 9), ItemSize = new Size(120, 30) };
            settingsTabs.TabPages.Add(accountPage);
            settingsTabs.TabPages.Add(websitesPage);
            settingsPage.Controls.Add(settingsTabs);
            todayPage.Controls.Add(summary);
            summary.Controls.Add(Ui.Label("Most used apps", 27, 260, 320, 28, 17, true, Palette.Ink));
            hourChart = new HourChart { Left = 14, Top = 76, Width = 480, Height = 96, Anchor = AnchorStyles.Top | AnchorStyles.Left };
            hourChart.Hours = hours;
            summary.Controls.Add(hourChart);
            summary.Controls.Add(Ui.Label("APP                                    TIME                     TYPE", 27, 279, 460, 22, 9, true, Palette.Muted));
            usageList = new ListView { Left = 14, Top = 186, Width = 480, Height = 160, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left,
                View = View.Details, FullRowSelect = true, GridLines = false, HeaderStyle = ColumnHeaderStyle.None, BackColor = Palette.Card, ForeColor = Palette.Ink, BorderStyle = BorderStyle.None,
                Font = new Font("Segoe UI", 11) };
            ImageList rowSpacing = new ImageList { ImageSize = new Size(1, 36) };
            usageList.SmallImageList = rowSpacing;
            usageList.Columns.Add("App", 190);
            usageList.Columns.Add("Time", 90);
            usageList.Columns.Add("Category", 120);
            summary.Controls.Add(usageList);
            AeroCard focusCard = new AeroCard();
            timerPage.Controls.Add(focusCard);
            focusCard.Controls.Add(Ui.Label("Focus sessions", 20, 17, 320, 28, 15, true, Palette.Ink));
            focusCard.Controls.Add(Ui.Label("Pause distracting apps while you focus.", 20, 49, 340, 25, 10, false, Palette.Muted));
            focusDuration = new ComboBox { Left = 20, Top = 93, Width = 112, Height = 40, DropDownStyle = ComboBoxStyle.DropDownList, FlatStyle = FlatStyle.Flat, BackColor = Palette.White, ForeColor = Palette.Ink, Font = new Font("Segoe UI", 11) };
            focusDuration.Items.AddRange(new object[] { "15 minutes", "25 minutes", "45 minutes", "60 minutes" });
            int selectedDuration = new[] { 15, 25, 45, 60 }.ToList().IndexOf(settings.SessionMinutes);
            focusDuration.SelectedIndex = selectedDuration < 0 ? 1 : selectedDuration;
            focusDuration.SelectedIndexChanged += delegate { settings.SessionMinutes = new[] { 15, 25, 45, 60 }[focusDuration.SelectedIndex]; Save(); RefreshSummary(); };
            focusCard.Controls.Add(focusDuration);
            focusButton.SetBounds(144, 91, 195, 40);
            focusCard.Controls.Add(focusButton);
            focusCard.Resize += delegate { focusButton.Width = Math.Max(125, focusCard.ClientSize.Width - 164); };
            hardModeCheck = new CheckBox { Text = "Hard Mode (stays on)", Left = 20, Top = 139, Width = 280, Height = 24, ForeColor = Palette.Muted, Checked = settings.HardModeEnabled, BackColor = Color.Transparent };
            hardModeCheck.CheckedChanged += delegate { settings.HardModeEnabled = hardModeCheck.Checked; Save(); };
            focusCard.Controls.Add(hardModeCheck);
            focusLabel.SetBounds(20, 164, 340, 22);
            focusLabel.ForeColor = Palette.Muted;
            focusCard.Controls.Add(focusLabel);
            Panel guidanceCard = new Panel { BackColor = Palette.Background };
            todayPage.Controls.Add(guidanceCard);
            guidanceCard.Controls.Add(Ui.Label("Your focus, in view.", 20, 12, 380, 42, 25, true, Palette.Ink));
            guidanceCard.Controls.Add(Ui.Label("Shaped by distracting app time against today's budget.", 20, 48, 350, 34, 10, false, Palette.Muted));
            geodeView = new GeodeView { Left = 35, Top = 72, Width = 320, Height = 165, Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            guidanceCard.Controls.Add(geodeView);
            geodeStatus = Ui.Label("Allow time to see your geode", 20, 241, 350, 24, 11, true, Palette.Ink);
            guidanceCard.Controls.Add(geodeStatus);
            guidanceCard.Resize += delegate {
                geodeView.Width = Math.Max(160, guidanceCard.ClientSize.Width - 70);
                geodeStatus.Width = Math.Max(200, guidanceCard.ClientSize.Width - 40);
            };
            timerPage.Resize += delegate {
                focusCard.SetBounds(Math.Max(24, (timerPage.ClientSize.Width - 620) / 2), Math.Min(300, Math.Max(250, timerPage.ClientSize.Height - 250)), Math.Min(620, timerPage.ClientSize.Width - 48), 220);
            };
            sessionClock = Ui.Label("25:00", 30, 140, 720, 135, 70, false);
            timerPage.Controls.Add(sessionClock);
            Label timerIntro = Ui.Label("Make time for what matters.", 30, 35, 720, 54, 29, true);
            timerIntro.TextAlign = ContentAlignment.MiddleCenter;
            timerPage.Controls.Add(timerIntro);
            timerPage.Controls.Add(Ui.Label("Choose a session and give your attention a little room.", 32, 96, 720, 34, 13, false, Palette.Muted));
            timerPage.Resize += delegate {
                sessionClock.SetBounds(20, 140, timerPage.ClientSize.Width - 40, 135);
                sessionClock.TextAlign = ContentAlignment.MiddleCenter;
                timerIntro.SetBounds(20, 35, timerPage.ClientSize.Width - 40, 54);
                foreach (Control control in timerPage.Controls) if (control is Label && control.Text.StartsWith("Choose a session")) { control.SetBounds(20, 96, timerPage.ClientSize.Width - 40, 34); ((Label)control).TextAlign = ContentAlignment.MiddleCenter; }
            };
            todayPage.Resize += delegate {
                int heroWidth = Math.Max(330, (todayPage.ClientSize.Width - 52) * 43 / 100);
                int activityX = heroWidth + 28;
                int activityWidth = Math.Max(430, todayPage.ClientSize.Width - activityX - 14);
                guidanceCard.SetBounds(8, 14, heroWidth, todayPage.ClientSize.Height - 28);
                geodeView.SetBounds(5, 94, heroWidth - 10, Math.Max(240, guidanceCard.Height - 240));
                geodeStatus.SetBounds(20, guidanceCard.Height - 118, heroWidth - 40, 35);
                geodeStatus.TextAlign = ContentAlignment.MiddleCenter;
                summary.SetBounds(activityX, 14, activityWidth, Math.Max(200, todayPage.ClientSize.Height - 28));
                distractionLabel.SetBounds(27, 128, 350, 38);
                foreach (Control child in summary.Controls) if (child is Label && child.Text == "Distraction budget") child.SetBounds(27, 106, 320, 24);
                goalBar.SetBounds(27, 174, activityWidth - 54, 5);
                bool compact = summary.Height < 550;
                hourChart.SetBounds(27, compact ? 190 : 201, activityWidth - 54, compact ? 75 : 106);
                foreach (Control child in summary.Controls) {
                    if (child is Label && child.Text == "Most used apps") child.Top = compact ? 280 : 329;
                    if (child is Label && (child.Text.StartsWith("APP ") || child.Text == "Total app time")) child.Visible = false;
                }
                int listTop = compact ? 320 : 374;
                usageList.SetBounds(27, listTop, activityWidth - 54, Math.Max(60, summary.Height - listTop - 24));
                usageList.Columns[0].Width = (activityWidth - 54) * 48 / 100;
                usageList.Columns[1].Width = (activityWidth - 54) * 22 / 100;
                usageList.Columns[2].Width = (activityWidth - 54) * 29 / 100;

            };

            websitesPage.Controls.Add(Ui.Label("Chrome website time", 14, 12, 600, 28, 14, true, Palette.Ink));
            websitesPage.Controls.Add(Ui.Label("Site totals come from the Amythest Chrome extension. Chrome app time stays separate to avoid double counting.", 14, 42, 810, 42, 10, false, Palette.Muted));
            websitesPage.Controls.Add(Ui.Label("WEBSITE                                              ACTIVE                   VIDEO                 DISTRACTION", 14, 84, 810, 22, 9, true, Palette.Muted));
            websiteList = new ListView { Left = 14, Top = 108, Width = 830, Height = 200, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                View = View.Details, FullRowSelect = true, GridLines = false, HeaderStyle = ColumnHeaderStyle.None, BackColor = Palette.Card, ForeColor = Palette.Ink, BorderStyle = BorderStyle.None,
                Font = new Font("Segoe UI", 10) };
            websiteList.Columns.Add("Website", 280);
            websiteList.Columns.Add("Active", 130);
            websiteList.Columns.Add("Video", 130);
            websiteList.Columns.Add("Distraction", 150);
            websitesPage.Controls.Add(websiteList);
            bridgeStatus = Ui.Label("", 14, 0, 800, 25, 10, false, Palette.Muted);
            bridgeStatus.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            websitesPage.Controls.Add(bridgeStatus);
            TextBox extensionId = Ui.Input(14, 0, 340);
            extensionId.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            extensionId.AccessibleName = "Amythest Chrome extension ID";
            websitesPage.Controls.Add(extensionId);
            Button connectChrome = Ui.Button("Connect Chrome", 366, 0, 160, 34);
            connectChrome.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            connectChrome.Click += delegate {
                try {
                    string hostPath = Path.Combine(Application.StartupPath, "Amythest.NativeHost.exe");
                    NativeBridge.Register(extensionId.Text.Trim(), hostPath, NativeBridge.DataFolder);
                    bridgeStatus.Text = "Connected. Reload the extension in chrome://extensions to start syncing.";
                }
                catch (Exception error) { MessageBox.Show(error.Message, "Connect Chrome", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
            };
            websitesPage.Controls.Add(connectChrome);
            accountStatus = Ui.Label("Account sync: sign in through the Chrome extension.", 540, 0, 350, 45, 10, false, Palette.Muted);
            accountStatus.Anchor = AnchorStyles.Right | AnchorStyles.Bottom;
            websitesPage.Controls.Add(accountStatus);
            websitesPage.Resize += delegate {
                int bottom = websitesPage.ClientSize.Height;
                websiteList.Height = Math.Max(90, bottom - 207);
                bridgeStatus.Top = bottom - 82;
                extensionId.Top = bottom - 51;
                connectChrome.Top = bottom - 55;
                accountStatus.SetBounds(Math.Max(540, websitesPage.ClientSize.Width - 370), bottom - 57, 350, 48);
            };
            bridgeStatus.Text = NativeBridge.IsRegistered(NativeBridge.DataFolder) ? "Chrome connected. Site time updates about once a minute." : "To connect, paste the extension ID from chrome://extensions below.";
            accountPage.Controls.Add(Ui.Label("Your Amythest account", 14, 14, 650, 32, 17, true, Palette.Ink));
            accountPage.Controls.Add(Ui.Label("Create an account or sign in with email and password in the Chrome extension dashboard. This Windows app then joins the account automatically.", 14, 52, 820, 46, 11, false, Palette.Muted));
            accountPageStatus = Ui.Label("Waiting for an account connection.", 14, 107, 570, 34, 11, false, Palette.Ink);
            accountPage.Controls.Add(accountPageStatus);
            useCloudLimits = Ui.Button("Use cloud app limits", 595, 103, 205, 31);
            useCloudLimits.Visible = false;
            useCloudLimits.Click += delegate {
                if (pendingCloudLimits == null) return;
                pendingCloudLimits.Apply(settings);
                goalInput.Value = settings.GoalMinutes;
                workEnabled.Checked = settings.WorkEnabled;
                workStart.Value = DateTime.Today.AddMinutes(settings.WorkStartMinutes);
                workEnd.Value = DateTime.Today.AddMinutes(settings.WorkEndMinutes);
                Save(); RefreshLists(); pendingCloudLimits = null; useCloudLimits.Visible = false;
                accountPageStatus.Text = "Cloud app limits applied.";
            };
            accountPage.Controls.Add(useCloudLimits);
            accountPage.Controls.Add(Ui.Label("Today across your devices", 14, 145, 650, 27, 14, true, Palette.Ink));
            accountPage.Controls.Add(Ui.Label("SOURCE                                   ACTIVE                   DISTRACTION              VIDEO", 14, 177, 810, 22, 9, true, Palette.Muted));
            cloudDeviceList = new ListView { Left = 14, Top = 201, Width = 830, Height = 166, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                View = View.Details, FullRowSelect = true, GridLines = false, HeaderStyle = ColumnHeaderStyle.None, BackColor = Palette.Card, ForeColor = Palette.Ink, BorderStyle = BorderStyle.None, Font = new Font("Segoe UI", 10) };
            cloudDeviceList.Columns.Add("Source", 200);
            cloudDeviceList.Columns.Add("Active", 130);
            cloudDeviceList.Columns.Add("Distraction", 150);
            cloudDeviceList.Columns.Add("Video", 120);
            cloudDeviceList.Items.Add(new ListViewItem("Sign in to see device totals."));
            accountPage.Controls.Add(cloudDeviceList);
            accountPage.Controls.Add(Ui.Label("Chrome website limits", 14, 376, 650, 27, 14, true, Palette.Ink));
            siteLimitDomain = Ui.Input(14, 409, 220);
            siteLimitDomain.AccessibleName = "Website domain";
            accountPage.Controls.Add(siteLimitDomain);
            siteLimitMinutes = new NumericUpDown { Left = 244, Top = 409, Width = 80, Minimum = 1, Maximum = 1440, Value = 30, BackColor = Palette.White, ForeColor = Palette.Ink };
            accountPage.Controls.Add(siteLimitMinutes);
            Button setSiteLimit = Ui.Button("Set site limit", 335, 405, 145, 34);
            accountPage.Controls.Add(setSiteLimit);
            Button removeSiteLimit = Ui.Button("Remove selected", 491, 405, 165, 34);
            accountPage.Controls.Add(removeSiteLimit);
            Action<string, int, Button> updateSiteLimit = delegate(string domain, int minutes, Button button) {
                if (latestSiteSettings == null) { accountPageStatus.Text = "Sign in and sync Chrome settings first."; return; }
                button.Enabled = false;
                int revision = latestSiteSettings.revision;
                ThreadPool.QueueUserWorkItem(delegate {
                    string error = null;
                    try { new CloudSync(NativeBridge.DataFolder, new ConvexTransport()).SetSiteLimit(domain, minutes, revision); }
                    catch (Exception) { error = "Could not save the site limit. Refresh account sync and try again."; }
                    if (!IsDisposed && IsHandleCreated) BeginInvoke((MethodInvoker)delegate {
                        button.Enabled = true;
                        if (error != null) accountPageStatus.Text = error;
                        else { siteLimitDomain.Clear(); accountPageStatus.Text = "Website limit saved. Syncing across devices…"; SyncCloud(); }
                    });
                });
            };
            setSiteLimit.Click += delegate { updateSiteLimit(siteLimitDomain.Text, (int)siteLimitMinutes.Value, setSiteLimit); };
            removeSiteLimit.Click += delegate {
                if (cloudSiteLimits.SelectedItem == null) return;
                string domain = cloudSiteLimits.SelectedItem.ToString().Split(' ')[0];
                updateSiteLimit(domain, 0, removeSiteLimit);
            };
            cloudSiteLimits = new ListBox { Left = 14, Top = 450, Width = 830, Height = 60, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 10) };
            cloudSiteLimits.Visible = false;
            accountPage.Controls.Add(cloudSiteLimits);
            cloudLimitsEmpty = Ui.Label("Sign in to see and manage Chrome website limits.", 14, 450, 810, 40, 11, false, Palette.Muted);
            accountPage.Controls.Add(cloudLimitsEmpty);
            accountPage.Resize += delegate {
                cloudDeviceList.Height = Math.Max(80, (accountPage.ClientSize.Height - 220) / 2 - 20);
                Control heading = accountPage.Controls.Cast<Control>().FirstOrDefault(c => c is Label && c.Text == "Chrome website limits");
                if (heading != null) heading.Top = cloudDeviceList.Bottom + 12;
                siteLimitDomain.Top = cloudDeviceList.Bottom + 45;
                siteLimitMinutes.Top = cloudDeviceList.Bottom + 45;
                setSiteLimit.Top = cloudDeviceList.Bottom + 41;
                removeSiteLimit.Top = cloudDeviceList.Bottom + 41;
                cloudSiteLimits.SetBounds(14, cloudDeviceList.Bottom + 86, accountPage.ClientSize.Width - 28, Math.Max(50, accountPage.ClientSize.Height - cloudDeviceList.Bottom - 98));
                cloudLimitsEmpty.SetBounds(14, cloudDeviceList.Bottom + 86, accountPage.ClientSize.Width - 28, 42);
            };

            boundaryPage.Controls.Add(Ui.Label("Daily distraction goal", 24, 20, 400, 24, 11, true, Palette.Ink));
            goalInput = new NumericUpDown { Left = 24, Top = 49, Width = 105, Minimum = 1, Maximum = 1440, Value = settings.GoalMinutes, BackColor = Palette.White, ForeColor = Palette.Ink };
            goalInput.ValueChanged += delegate { settings.GoalMinutes = (int)goalInput.Value; Save(); RefreshSummary(); };
            boundaryPage.Controls.Add(goalInput);
            boundaryPage.Controls.Add(Ui.Label("minutes per day", 140, 48, 200, 25, 10, false, Palette.Muted));

            boundaryPage.Controls.Add(Ui.Label("Distracting apps", 24, 92, 400, 24, 11, true, Palette.Ink));
            boundaryPage.Controls.Add(Ui.Label("Enter a process name, like discord.exe. Selected apps count toward your goal.", 24, 118, 760, 40, 10, false, Palette.Muted));
            distractionInput = Ui.Input(24, 163, 225);
            boundaryPage.Controls.Add(distractionInput);
            Button addDistraction = Ui.Button("Add app", 260, 158, 110, 34);
            addDistraction.Click += delegate { string app = AppPolicy.NormalizeApp(distractionInput.Text); if (!AppPolicy.CanBlock(app)) { MessageBox.Show("Enter a valid app process name. Windows system apps cannot be blocked."); return; } settings.DistractingApps.Add(app); distractionInput.Clear(); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(addDistraction);
            distractionList = new ListBox { Left = 24, Top = 205, Width = 345, Height = 88, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle };
            boundaryPage.Controls.Add(distractionList);
            Button removeDistraction = Ui.Button("Remove selected", 382, 205, 160, 34);
            removeDistraction.Click += delegate { if (distractionList.SelectedItem == null) return; settings.DistractingApps.Remove(distractionList.SelectedItem.ToString()); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(removeDistraction);

            boundaryPage.Controls.Add(Ui.Label("Daily app limits", 24, 313, 400, 24, 11, true, Palette.Ink));
            limitInput = Ui.Input(24, 343, 225);
            boundaryPage.Controls.Add(limitInput);
            limitMinutes = new NumericUpDown { Left = 260, Top = 343, Width = 95, Minimum = 1, Maximum = 1440, Value = 30, BackColor = Palette.White, ForeColor = Palette.Ink };
            boundaryPage.Controls.Add(limitMinutes);
            Button addLimit = Ui.Button("Set limit", 366, 338, 117, 34);
            addLimit.Click += delegate { string app = AppPolicy.NormalizeApp(limitInput.Text); if (!AppPolicy.CanBlock(app)) { MessageBox.Show("Enter a valid app process name. Windows system apps cannot be blocked."); return; } settings.DailyLimits[app] = (int)limitMinutes.Value; limitInput.Clear(); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(addLimit);
            limitList = new ListBox { Left = 24, Top = 387, Width = 345, Height = 82, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle };
            boundaryPage.Controls.Add(limitList);
            Button removeLimit = Ui.Button("Remove selected", 382, 387, 160, 34);
            removeLimit.Click += delegate { if (limitList.SelectedItem == null) return; string key = limitList.SelectedItem.ToString().Split(' ')[0]; settings.DailyLimits.Remove(key); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(removeLimit);

            boundaryPage.Controls.Add(Ui.Label("Work hours", 24, 485, 400, 24, 11, true, Palette.Ink));
            workEnabled = new CheckBox { Text = "Pause distracting apps on weekdays", Left = 24, Top = 516, Width = 350, Height = 27, ForeColor = Palette.Ink, Checked = settings.WorkEnabled };
            workEnabled.CheckedChanged += delegate { settings.WorkEnabled = workEnabled.Checked; Save(); };
            boundaryPage.Controls.Add(workEnabled);
            workStart = TimePicker(settings.WorkStartMinutes, 24, 552);
            workEnd = TimePicker(settings.WorkEndMinutes, 184, 552);
            workStart.ValueChanged += delegate { settings.WorkStartMinutes = workStart.Value.Hour * 60 + workStart.Value.Minute; Save(); };
            workEnd.ValueChanged += delegate { settings.WorkEndMinutes = workEnd.Value.Hour * 60 + workEnd.Value.Minute; Save(); };
            boundaryPage.Controls.Add(workStart); boundaryPage.Controls.Add(workEnd);
            boundaryPage.Controls.Add(Ui.Label("to", 148, 553, 30, 27, 10, false, Palette.Muted));
            // Keep settings in two scan-friendly columns. The page itself scrolls
            // only when the window is too short to show both columns completely.
            Panel leftSettings = new AeroCard();
            Panel rightSettings = new AeroCard();
            List<Control> settingsControls = boundaryPage.Controls.Cast<Control>().ToList();
            foreach (Control control in settingsControls)
            {
                if (control.Top < 300) leftSettings.Controls.Add(control);
                else { control.Top -= 300; rightSettings.Controls.Add(control); }
            }
            boundaryPage.Controls.Add(leftSettings);
            boundaryPage.Controls.Add(rightSettings);
            VScrollBar settingsScroll = new VScrollBar();
            boundaryPage.Controls.Add(settingsScroll);
            foreach (Control control in leftSettings.Controls)
                if (control is Label && control.Width > 500) control.Width = 350;
            distractionList.SetBounds(24, 205, 345, 64);
            removeDistraction.SetBounds(24, 276, 160, 31);
            limitInput.SetBounds(24, 53, 180, 27);
            limitMinutes.SetBounds(213, 53, 70, 27);
            addLimit.SetBounds(294, 49, 80, 33);
            limitList.SetBounds(24, 99, 345, 68);
            removeLimit.SetBounds(24, 174, 160, 31);
            foreach (Control control in rightSettings.Controls)
            {
                if (control is Label && control.Width > 500) control.Width = 350;
                if (control is Label && control.Text == "Work hours") control.Top = 217;
                if (control is Label && control.Text == "to") control.Top = 281;
            }
            workEnabled.SetBounds(24, 244, 350, 27);
            workStart.SetBounds(24, 279, 120, 24);
            workEnd.SetBounds(184, 279, 120, 24);
            Action layoutSettings = delegate {
                int gap = 16;
                int columnWidth = Math.Max(370, (boundaryPage.ClientSize.Width - 96 - gap) / 2);
                foreach (Control control in leftSettings.Controls) if (control is Label) {
                    control.Font = new Font("Segoe UI", control.Font.Bold ? 13 : 11, control.Font.Style);
                    if (control.Text == "Daily distraction goal") control.SetBounds(24, 20, columnWidth - 48, 28);
                    else if (control.Text == "minutes per day") control.SetBounds(140, 63, columnWidth - 164, 28);
                    else if (control.Text == "Distracting apps") control.SetBounds(24, 112, columnWidth - 48, 30);
                    else if (control.Text.StartsWith("Enter a process")) control.SetBounds(24, 148, columnWidth - 48, 48);
                }
                goalInput.SetBounds(24, 59, 105, 34); goalInput.Font = new Font("Segoe UI", 12);
                distractionInput.SetBounds(24, 207, columnWidth - 158, 34); distractionInput.Font = new Font("Segoe UI", 12);
                addDistraction.SetBounds(columnWidth - 124, 204, 100, 40);
                distractionList.SetBounds(24, 257, columnWidth - 48, 80);
                removeDistraction.SetBounds(24, 353, 170, 40);
                foreach (Control control in rightSettings.Controls) if (control is Label) {
                    control.Font = new Font("Segoe UI", control.Font.Bold ? 13 : 11, control.Font.Style);
                    if (control.Text == "Daily app limits") control.SetBounds(24, 20, columnWidth - 48, 28);
                    else if (control.Text == "Work hours") control.SetBounds(24, 287, columnWidth - 48, 30);
                    else if (control.Text == "to") control.SetBounds(153, 367, 28, 28);
                }
                limitInput.SetBounds(24, 64, columnWidth - 224, 34); limitInput.Font = new Font("Segoe UI", 12);
                limitMinutes.SetBounds(columnWidth - 190, 64, 70, 34); limitMinutes.Font = new Font("Segoe UI", 12);
                addLimit.SetBounds(columnWidth - 110, 61, 86, 40);
                limitList.SetBounds(24, 117, columnWidth - 48, 100);
                removeLimit.SetBounds(24, 232, 170, 40);
                workEnabled.SetBounds(24, 324, columnWidth - 48, 28);
                workStart.SetBounds(24, 367, 120, 30); workEnd.SetBounds(184, 367, 120, 30);
                int viewport = boundaryPage.ClientSize.Height;
                int maximum = Math.Max(0, 450 - viewport);
                settingsScroll.Visible = maximum > 0;
                settingsScroll.SetBounds(boundaryPage.ClientSize.Width - settingsScroll.Width, 0, settingsScroll.Width, viewport);
                settingsScroll.LargeChange = Math.Max(1, viewport);
                settingsScroll.Maximum = maximum + settingsScroll.LargeChange - 1;
                if (settingsScroll.Value > maximum) settingsScroll.Value = maximum;
                leftSettings.SetBounds(18, 8 - settingsScroll.Value, columnWidth, 430);
                rightSettings.SetBounds(18 + columnWidth + gap, 8 - settingsScroll.Value, columnWidth, 430);
            };
            settingsScroll.Scroll += delegate { layoutSettings(); };
            boundaryPage.MouseWheel += delegate(object sender, MouseEventArgs e) {
                int maximum = Math.Max(0, 450 - boundaryPage.ClientSize.Height);
                settingsScroll.Value = Math.Max(0, Math.Min(maximum, settingsScroll.Value - Math.Sign(e.Delta) * 30));
                layoutSettings();
            };
            boundaryPage.Resize += delegate { layoutSettings(); };
            layoutSettings();
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            int dark = 1;
            DwmSetWindowAttribute(Handle, 20, ref dark, sizeof(int));
        }

        private static DateTimePicker TimePicker(int minutes, int x, int y)
        {
            return new DateTimePicker { Left = x, Top = y, Width = 120, Format = DateTimePickerFormat.Custom, CustomFormat = "h:mm tt", ShowUpDown = true,
                Value = DateTime.Today.AddMinutes(minutes) };
        }

        private void Tick(object sender, EventArgs e)
        {
            DateTime now = DateTime.Now;
            if (now.Date != day.Date) { store.SaveUsage(day, usage); store.SaveHours(day, hours); day = now.Date; usage = store.LoadUsage(day); hours = store.LoadHours(day); hourChart.Hours = hours; }
            long elapsed = Math.Max(0, Math.Min(1500, (long)(now - lastTick).TotalMilliseconds));
            lastTick = now;
            string app = ForegroundApp.IsIdle(60) ? null : ForegroundApp.CurrentName();
            if (app != null && app != "amythest")
            {
                long current;
                usage.TryGetValue(app, out current);
                usage[app] = current + elapsed;
                hours[now.Hour] = Math.Min(3600000, hours[now.Hour] + elapsed);
                string reason = AppPolicy.BlockReason(app, usage[app], settings, now, settings.FocusUntil, settings.PausedUntil);
                if (reason != null && !blocker.Visible) blocker.ShowFor(app, reason, settings.HardModeUntil > now && settings.FocusUntil > now);
            }
            if (++saveTicks >= 10) { saveTicks = 0; store.SaveUsage(day, usage); store.SaveHours(day, hours); RefreshWebsites(); hourChart.Hours = hours; }
            if (++cloudTicks >= 60) { cloudTicks = 0; SyncCloud(); }
            RefreshSummary();
            if (Visible) RefreshToday();
        }

        private static string TimeText(long ms)
        {
            long minutes = ms / 60000;
            if (minutes < 60) return minutes + "m";
            long remainder = minutes % 60;
            return (minutes / 60) + "h" + (remainder == 0 ? "" : " " + remainder + "m");
        }
        private void RefreshAll() { RefreshSummary(); RefreshToday(); RefreshWebsites(); RefreshLists(); }
        private void RefreshSummary()
        {
            if (sessionClock != null) {
                TimeSpan remaining = settings.FocusUntil > DateTime.Now ? settings.FocusUntil - DateTime.Now : TimeSpan.FromMinutes(settings.SessionMinutes);
                sessionClock.Text = ((int)remaining.TotalMinutes).ToString("00") + ":" + remaining.Seconds.ToString("00");
            }
            long total = usage.Values.Sum();
            long distracting = usage.Where(x => settings.DistractingApps.Contains(x.Key)).Sum(x => x.Value);
            totalLabel.Text = TimeText(total);
            distractionLabel.Text = TimeText(distracting) + " / " + TimeText((long)settings.GoalMinutes * 60000);
            goalBar.Fraction = (double)distracting / ((long)settings.GoalMinutes * 60000);
            double fraction = (double)distracting / Math.Max(1L, (long)settings.GoalMinutes * 60000);
            if (geodeView != null) geodeView.Stage = fraction >= 1 ? 0 : fraction >= .65 ? 1 : fraction >= .30 ? 2 : 3;
            if (geodeStatus != null) geodeStatus.Text = fraction >= 1 ? "Budget reached · geode resting" : fraction >= .65 ? "Near your distraction budget" : fraction >= .30 ? "Room to focus today" : "Your geode is open";
            if (settings.FocusUntil > DateTime.Now)
            {
                bool hard = settings.HardModeUntil > DateTime.Now;
                focusButton.Text = hard ? "Hard Mode active" : "End focus session";
                focusButton.Enabled = !hard;
                focusDuration.Enabled = false;
                hardModeCheck.Enabled = false;
                focusLabel.Text = "Focus ends at " + settings.FocusUntil.ToString("h:mm tt") + (hard ? " · no breaks" : "");
            }
            else { focusButton.Text = "Start focus session"; focusButton.Enabled = true; focusDuration.Enabled = true; hardModeCheck.Enabled = true; focusLabel.Text = "No focus session running"; }
        }
        private void RefreshToday()
        {
            usageList.BeginUpdate();
            usageList.Items.Clear();
            foreach (KeyValuePair<string, long> row in usage.OrderByDescending(x => x.Value).Take(80))
            {
                string display = row.Key == "code" ? "Visual Studio Code" : row.Key == "chrome" ? "Google Chrome" : row.Key == "msedge" ? "Microsoft Edge" : row.Key == "discord" ? "Discord" : row.Key;
                ListViewItem item = new ListViewItem(display);
                item.SubItems.Add(TimeText(row.Value));
                item.SubItems.Add(settings.DistractingApps.Contains(row.Key) ? "Distraction" : "Other app");
                usageList.Items.Add(item);
            }
            usageList.EndUpdate();
        }
        private void RefreshWebsites()
        {
            if (websiteList == null) return;
            WebsiteSnapshot snapshot = NativeBridge.LoadSnapshot(DateTime.Today, NativeBridge.DataFolder);
            websiteList.BeginUpdate();
            websiteList.Items.Clear();
            if (snapshot != null)
            {
                foreach (WebsiteRow row in snapshot.sites.OrderByDescending(x => x.activeMs).Take(200))
                {
                    ListViewItem item = new ListViewItem(row.domain);
                    item.SubItems.Add(TimeText(row.activeMs));
                    item.SubItems.Add(TimeText(row.videoMs));
                    item.SubItems.Add(TimeText(row.distractionMs));
                    websiteList.Items.Add(item);
                }
            }
            websiteList.EndUpdate();
        }
        private void SyncCloud()
        {
            if (Interlocked.Exchange(ref cloudBusy, 1) != 0) return;
            DateTime snapshotDate = day;
            Dictionary<string, long> appUsage = new Dictionary<string, long>(usage);
            Settings syncSettings = new Settings();
            CloudWindowsSettings.From(settings).Apply(syncSettings);
            syncSettings.CloudRevision = settings.CloudRevision;
            syncSettings.CloudFingerprint = settings.CloudFingerprint;
            ThreadPool.QueueUserWorkItem(delegate {
                CloudSyncResult result = new CloudSync(NativeBridge.DataFolder, new ConvexTransport()).SyncToday(snapshotDate, appUsage, syncSettings);
                if (!IsDisposed && IsHandleCreated) BeginInvoke((MethodInvoker)delegate {
                    int otherDevices = result.Days == null ? 0 : result.Days.Count(item => item.source == "chrome" || item.deviceId != new CloudSync(NativeBridge.DataFolder, new ConvexTransport()).DeviceId());
                    accountStatus.Text = result.Message + (result.Connected ? " " + otherDevices + " other source" + (otherDevices == 1 ? "" : "s") + " today." : "");
                    accountPageStatus.Text = result.Message;
                    if (result.SettingsConflict) { pendingCloudLimits = result.WindowsSettings; useCloudLimits.Visible = true; }
                    else { pendingCloudLimits = null; useCloudLimits.Visible = false; }
                    if (!result.SettingsConflict && result.WindowsSettings != null && (settings.CloudRevision != result.WindowsSettings.revision || settings.CloudFingerprint != CloudWindowsSettings.Fingerprint(result.WindowsSettings))) {
                        result.WindowsSettings.Apply(settings);
                        goalInput.Value = settings.GoalMinutes;
                        workEnabled.Checked = settings.WorkEnabled;
                        workStart.Value = DateTime.Today.AddMinutes(settings.WorkStartMinutes);
                        workEnd.Value = DateTime.Today.AddMinutes(settings.WorkEndMinutes);
                        Save(); RefreshLists();
                    }
                    cloudSiteLimits.Items.Clear();
                    latestSiteSettings = result.SiteSettings;
                    if (result.SiteSettings != null && result.SiteSettings.siteLimits != null)
                        foreach (CloudSiteLimit limit in result.SiteSettings.siteLimits.OrderBy(x => x.domain))
                            cloudSiteLimits.Items.Add(limit.domain + " · " + limit.minutes + " min/day");
                    cloudSiteLimits.Visible = cloudSiteLimits.Items.Count > 0;
                    cloudLimitsEmpty.Visible = !cloudSiteLimits.Visible;
                    cloudLimitsEmpty.Text = result.Connected ? "No Chrome website limits set." : "Sign in to see and manage Chrome website limits.";
                    cloudDeviceList.BeginUpdate();
                    cloudDeviceList.Items.Clear();
                    if (result.Days != null) foreach (CloudDay entry in result.Days.OrderByDescending(item => item.activeMs)) {
                        string source = entry.source == "chrome" ? "Chrome" : entry.source == "android" ? "Android" : "Windows";
                        string device = entry.deviceId == null ? "" : entry.deviceId.Substring(0, Math.Min(6, entry.deviceId.Length));
                        ListViewItem row = new ListViewItem(source + " " + device);
                        row.SubItems.Add(TimeText(entry.activeMs));
                        row.SubItems.Add(TimeText(entry.distractionMs));
                        row.SubItems.Add(TimeText(entry.videoMs));
                        cloudDeviceList.Items.Add(row);
                    }
                    if (cloudDeviceList.Items.Count == 0) cloudDeviceList.Items.Add(new ListViewItem(result.Connected ? "No synced activity yet." : "Sign in to see device totals."));
                    cloudDeviceList.EndUpdate();
                });
                Interlocked.Exchange(ref cloudBusy, 0);
            });
        }
        private void RefreshLists()
        {
            distractionList.Items.Clear();
            foreach (string app in settings.DistractingApps.OrderBy(x => x)) distractionList.Items.Add(app);
            limitList.Items.Clear();
            foreach (KeyValuePair<string, int> pair in settings.DailyLimits.OrderBy(x => x.Key)) limitList.Items.Add(pair.Key + " · " + pair.Value + " min/day");
            long weekTotal = usage.Values.Sum();
            for (int offset = 1; offset < 7; offset++) weekTotal += store.LoadUsage(DateTime.Today.AddDays(-offset)).Values.Sum();
            RefreshSummary(); RefreshToday();
        }
        private void Save() { store.SaveSettings(settings); store.SaveUsage(day, usage); store.SaveHours(day, hours); }
    }

    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
